import { Query, ID } from 'appwrite';
import {
  databases,
  storage,
  DATABASE_ID,
  BUCKET_ID,
  COLLECTIONS,
  isAppwriteConfigured,
  retryOperation,
  removeUndefined
} from './base';
import { VerificationResult, NewsArticle, MediaFile } from '@/types/news';
import { logger } from '@/lib/logger';
import { generateQueryHash } from '@/lib/utils';

// Curation threshold - number of similar queries before a claim becomes curated
// Set to 1 for initial launch to ensure content appears, can increase later
export const CURATION_THRESHOLD = 3;

// Type for verification document (improved schema v2 with curation fields)
export interface VerificationDocument {
  id?: string;
  slug: string;
  userId?: string;
  query?: string;
  content?: string;
  title?: string;
  articleUrl?: string;
  articleTitle?: string;
  veracity?: string;
  confidence?: number;
  result?: string; // JSON string
  timestamp: string;
  isPublic?: boolean;
  viewCount?: number;
  upvotes?: number;
  downvotes?: number;
  mediaId?: string;
  mediaUrl?: string;
  mediaType?: string;
  // Curation fields
  queryHash?: string;
  queryCount?: number;
  isCurated?: boolean;
  curatedAt?: string | null;
  verificationDepth?: 'standard' | 'deep';
}

// Increment view count for a verification
export const incrementViewCount = async (docId: string, currentCount: number): Promise<void> => {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.VERIFICATIONS,
      docId,
      { viewCount: currentCount + 1 }
    );
    logger.debug('Successfully incremented view count for document:', docId);
  } catch (error) {
    logger.warn('Failed to increment view count for document:', {
      docId,
      currentCount,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    // Silently fail - view count is not critical
  }
};

/**
 * Find similar verifications by query hash
 * Returns verifications that have the same normalized query hash
 */
export const findSimilarVerifications = async (
  queryHash: string,
  limit: number = 10
): Promise<VerificationDocument[]> => {
  if (!isAppwriteConfigured() || !queryHash) {
    return [];
  }

  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.VERIFICATIONS,
      [
        Query.equal('queryHash', queryHash),
        Query.orderDesc('timestamp'),
        Query.limit(limit)
      ]
    );

    return response.documents.map((doc) => ({
      id: doc.$id,
      slug: doc.slug,
      userId: doc.userId,
      query: doc.query,
      content: doc.content,
      title: doc.title,
      articleUrl: doc.articleUrl,
      articleTitle: doc.articleTitle,
      veracity: doc.veracity,
      confidence: doc.confidence,
      result: doc.result,
      timestamp: doc.timestamp,
      isPublic: doc.isPublic ?? true,
      viewCount: doc.viewCount || 0,
      upvotes: doc.upvotes || 0,
      downvotes: doc.downvotes || 0,
      queryHash: doc.queryHash,
      queryCount: 1, // queryCount is not in DB schema, always default to 1
      // isCurated based on having a valid result and being public
      isCurated: doc.isPublic && doc.result && doc.result.length > 10,
      curatedAt: doc.curatedAt,
      verificationDepth: doc.verificationDepth || 'standard',
    }));
  } catch (error) {
    logger.error('Error finding similar verifications:', error);
    return [];
  }
};

// Fetch a verification result by slug
export const getVerificationBySlug = async (slug: string, currentUserId?: string): Promise<VerificationDocument | null> => {
  if (!isAppwriteConfigured() || !slug) {
    logger.warn('getVerificationBySlug: Not configured or missing slug');
    return null;
  }
  
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.VERIFICATIONS,
      [Query.equal('slug', slug), Query.limit(1)]
    );
    
    if (response.documents.length === 0) {
      logger.info('No document found for slug:', slug);
      return null;
    }
    
    const doc = response.documents[0];
    
    // Check privacy: if verification is private, only the owner can view it
    const isPrivate = doc.isPublic === false;
    const isOwner = currentUserId && doc.userId === currentUserId;
    
    if (isPrivate && !isOwner) {
      logger.info('Access denied: verification is private and user is not owner');
      return null;
    }
    
    // Increment view count (fire and forget)
    incrementViewCount(doc.$id, doc.viewCount || 0).catch(() => {});
    
    const data: VerificationDocument = {
      id: doc.$id,
      slug: doc.slug,
      userId: doc.userId,
      query: doc.query,
      content: doc.content,
      title: doc.title,
      articleUrl: doc.articleUrl,
      articleTitle: doc.articleTitle,
      veracity: doc.veracity,
      confidence: doc.confidence,
      result: doc.result,
      timestamp: doc.timestamp,
      isPublic: doc.isPublic ?? true,
      viewCount: doc.viewCount || 0,
      upvotes: doc.upvotes || 0,
      downvotes: doc.downvotes || 0,
    };
    
    return data;
  } catch (error) {
    logger.error('Error fetching verification by slug:', error);
    return null;
  }
};

// Vote on a verification
export const voteOnVerification = async (docId: string, type: 'up' | 'down'): Promise<void> => {
  if (!isAppwriteConfigured()) return;
  
  try {
    const doc = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.VERIFICATIONS,
      docId
    );
    
    const update: Record<string, number> = {};
    if (type === 'up') {
      update.upvotes = (doc.upvotes || 0) + 1;
    } else {
      update.downvotes = (doc.downvotes || 0) + 1;
    }
    
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.VERIFICATIONS,
      docId,
      update
    );
  } catch (error) {
    logger.error('Error voting on verification:', error);
    throw error;
  }
};

export const saveVerificationToCollection = async (
  searchQuery: string,
  newsContent: string,
  result: VerificationResult,
  userId: string = 'anonymous',
  selectedArticle?: NewsArticle | null,
  slug?: string,
  title?: string,
  mediaFile?: MediaFile
) => {
  if (!isAppwriteConfigured() || !slug) return;
  
  try {
    let mediaId = '';
    let mediaUrl = '';

    // Upload media if present
    if (mediaFile?.file) {
      try {
        const uploadedFile = await storage.createFile(
          BUCKET_ID,
          ID.unique(),
          mediaFile.file
        );
        mediaId = uploadedFile.$id;
        mediaUrl = storage.getFileView(BUCKET_ID, mediaId).toString();
        logger.info('Media uploaded successfully:', { mediaId, mediaUrl });
      } catch (uploadError) {
        logger.error('Error uploading media to Appwrite:', uploadError);
      }
    }

    // Clean the result object to remove undefined values
    const cleanResult = removeUndefined({
      veracity: result.veracity,
      confidence: result.confidence,
      explanation: result.explanation,
      sources: result.sources,
      correctedInfo: result.correctedInfo
    });

    // Generate query hash for similarity matching
    const queryHash = generateQueryHash(searchQuery + ' ' + newsContent.substring(0, 500));

    // Check for existing similar verifications
    const similarVerifications = await findSimilarVerifications(queryHash, 1);
    
    if (similarVerifications.length > 0) {
      // Similar verification exists - log it for tracking
      const existing = similarVerifications[0];
      if (existing.id) {
        logger.info('Found existing similar verification:', { 
          existingId: existing.id, 
          queryHash
        });
      }
      // Still save the new verification for history/audit purposes
    }

    // Improved schema v2 - with denormalized fields for filtering and curation
    const documentData = removeUndefined({
      // Core identification
      slug: slug,
      userId: userId === 'anonymous' ? null : userId,
      
      // Content
      query: searchQuery.substring(0, 1000), // Limit size
      content: newsContent.substring(0, 10000), // Limit size
      title: title?.substring(0, 500) || '',
      
      // Source article
      articleUrl: selectedArticle?.url || '',
      articleTitle: selectedArticle?.title?.substring(0, 500) || '',
      
      // Denormalized result fields for quick filtering
      veracity: result.veracity,
      confidence: result.confidence,
      result: JSON.stringify(cleanResult),
      
      // Media
      mediaId,
      mediaUrl,
      mediaType: mediaFile?.type,
      
      // Metadata
      timestamp: new Date().toISOString(),
      isPublic: true,
      viewCount: 0,
      upvotes: 0,
      downvotes: 0,
      
      // Curation fields - curation is determined by having a valid result
      queryHash,
      // Note: queryCount and isCurated are not in DB schema, derived at query time
      verificationDepth: 'standard',
    });

    await retryOperation(() =>
      databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.VERIFICATIONS,
        ID.unique(),
        documentData
      )
    );
    logger.info('Verification saved to collection successfully');
  } catch (error) {
    logger.error('Error saving verification to collection:', error);
  }
};

// Update verification privacy setting
export const updateVerificationPrivacy = async (
  slug: string,
  userId: string,
  isPublic: boolean
): Promise<boolean> => {
  if (!isAppwriteConfigured() || !slug || !userId) {
    return false;
  }
  
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.VERIFICATIONS,
      [Query.equal('slug', slug), Query.limit(1)]
    );
    
    if (response.documents.length === 0) {
      return false;
    }
    
    const doc = response.documents[0];
    
    // Verify ownership
    if (doc.userId !== userId) {
      logger.error('Unauthorized: Verification does not belong to user');
      return false;
    }
    
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.VERIFICATIONS,
      doc.$id,
      { isPublic }
    );
    
    logger.info(`Verification privacy updated to ${isPublic ? 'public' : 'private'}`);
    return true;
  } catch (error) {
    logger.error('Error updating verification privacy:', error);
    return false;
  }
};

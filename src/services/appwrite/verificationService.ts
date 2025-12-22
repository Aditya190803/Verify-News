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
import { queryCache } from '@/lib/queryCache';

// Type for verification document (improved schema v2)
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

// Fetch a verification result by slug
export const getVerificationBySlug = async (slug: string): Promise<VerificationDocument | null> => {
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

    // Improved schema v2 - with denormalized fields for filtering
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
    // Invalidate cache since we've added new data
    invalidateRecentVerificationsCache();
  } catch (error) {
    logger.error('Error saving verification to collection:', error);
  }
};

// Get recent public verifications (for feed/discovery)
export const getRecentVerifications = async (
  limit: number = 20,
  veracityFilter?: string,
  sortBy: 'recent' | 'views' | 'votes' = 'recent',
  dateRange?: { start: string; end: string }
): Promise<VerificationDocument[]> => {
  if (!isAppwriteConfigured()) {
    return [];
  }
  
  // Generate cache key based on parameters
  const cacheKey = `getRecentVerifications:${limit}:${veracityFilter || 'none'}:${sortBy}:${dateRange ? JSON.stringify(dateRange) : 'none'}`;
  
  // Try to get cached results first
  const cachedResults = queryCache.get<VerificationDocument[]>(cacheKey);
  if (cachedResults) {
    logger.debug('Returning cached recent verifications');
    return cachedResults;
  }
  
  try {
    const queries = [
      Query.equal('isPublic', true),
      Query.limit(limit)
    ];
    
    if (veracityFilter) {
      queries.push(Query.equal('veracity', veracityFilter));
    }

    if (dateRange) {
      queries.push(Query.greaterThanEqual('timestamp', dateRange.start));
      queries.push(Query.lessThanEqual('timestamp', dateRange.end));
    }

    if (sortBy === 'views') {
      queries.push(Query.orderDesc('viewCount'));
    } else if (sortBy === 'votes') {
      queries.push(Query.orderDesc('upvotes'));
    } else {
      queries.push(Query.orderDesc('timestamp'));
    }
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.VERIFICATIONS,
      queries
    );
    
    const results = response.documents.map((doc) => ({
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
    }));
    
    // Cache the results for future requests
    queryCache.set(cacheKey, results);
    
    return results;
  } catch (error) {
    logger.error('Error getting recent verifications:', error);
    return [];
  }
};

// Invalidate cache for getRecentVerifications
// This should be called when new verifications are added or existing ones are updated
export const invalidateRecentVerificationsCache = (): void => {
  logger.debug('Invalidating recent verifications cache');
  // Clear all cache entries that start with the function name
  // Since queryCache doesn't expose internal keys, we'll use a prefix-based approach
  // For now, we'll clear the entire query cache as a simple approach
  // In a production environment, you might want a more targeted approach
  queryCache.clear();
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

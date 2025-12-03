import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../config/appwrite';
import { VerificationResult, NewsArticle } from '@/types/news';
import { AppwriteError, CleanedObject } from '@/types/search';

// Type for search history item (improved schema v2)
export interface SearchHistoryItem {
  id?: string;
  query: string;
  title?: string;
  timestamp: string;
  articleUrl?: string;
  articleTitle?: string;
  resultType: 'search' | 'verification';
  slug?: string;
  veracity?: string;
  confidence?: number;
}

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
}

// Check if Appwrite is configured
const isAppwriteConfigured = (): boolean => {
  return !!import.meta.env.VITE_APPWRITE_PROJECT_ID && !!import.meta.env.VITE_APPWRITE_DATABASE_ID;
};

// Utility function to retry Appwrite operations with better error handling
const retryOperation = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      const appwriteError = error as AppwriteError;
      lastError = appwriteError;
      console.warn(`Appwrite operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      // Don't retry if it's a permission error
      if (appwriteError.code === 401 || appwriteError.code === 403) {
        throw error;
      }
      
      // Handle network/connectivity errors
      if (appwriteError.message?.includes('ERR_BLOCKED_BY_CLIENT') || 
          appwriteError.message?.includes('Failed to fetch') ||
          appwriteError.message?.includes('NetworkError')) {
        console.warn(`🚫 Network error detected: ${appwriteError.message}`);
        if (attempt === maxRetries) {
          throw new Error('Connection blocked - please disable ad blocker for this site or try again later');
        }
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError;
};

// Helper function to remove undefined values recursively
const removeUndefined = (obj: unknown): CleanedObject | unknown => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefined);
  
  const cleaned: CleanedObject = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (value !== undefined) {
      cleaned[key] = removeUndefined(value);
    }
  }
  return cleaned;
};

// Fetch a verification result by slug
export const getVerificationBySlug = async (slug: string): Promise<VerificationDocument | null> => {
  if (!isAppwriteConfigured() || !slug) {
    console.warn('❌ getVerificationBySlug: Not configured or missing slug');
    return null;
  }
  
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.VERIFICATIONS,
      [Query.equal('slug', slug), Query.limit(1)]
    );
    
    if (response.documents.length === 0) {
      console.log('❌ No document found for slug:', slug);
      return null;
    }
    
    const doc = response.documents[0];
    console.log('✅ Found document for slug:', slug);
    
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
    };
    
    console.log('Found document for slug:', slug);
    return data;
  } catch (error) {
    console.error('Error fetching verification by slug:', error);
    return null;
  }
};

// Increment view count for a verification
const incrementViewCount = async (docId: string, currentCount: number): Promise<void> => {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.VERIFICATIONS,
      docId,
      { viewCount: currentCount + 1 }
    );
  } catch {
    // Silently fail - view count is not critical
  }
};

// REMOVED: saveVerificationToUserHistory - was duplicate storage
// User history is now only stored in SEARCH_HISTORY collection via saveVerificationToHistory

export const saveVerificationToCollection = async (
  searchQuery: string,
  newsContent: string,
  result: VerificationResult,
  userId: string = 'anonymous',
  selectedArticle?: NewsArticle | null,
  slug?: string,
  title?: string
) => {
  if (!isAppwriteConfigured() || !slug) return;
  
  try {
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
      
      // Metadata
      timestamp: new Date().toISOString(),
      isPublic: true,
      viewCount: 0,
    });

    await retryOperation(() =>
      databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.VERIFICATIONS,
        ID.unique(),
        documentData
      )
    );
    console.log('✅ Verification saved to collection successfully');
  } catch (error) {
    console.error('Error saving verification to collection:', error);
    // Don't throw - allow the app to continue working
  }
};

// Save search query to user's search history
export const saveSearchToHistory = async (
  userId: string,
  searchQuery: string,
  selectedArticle?: NewsArticle | null,
  slug?: string,
  title?: string
) => {
  console.log('🔍 saveSearchToHistory called:', { userId, searchQuery, configured: isAppwriteConfigured() });
  
  if (!userId || !isAppwriteConfigured()) {
    console.warn('❌ saveSearchToHistory aborted - missing userId or Appwrite not configured');
    return;
  }
  
  try {
    console.log('💾 Attempting to save search to history...');
    
    // Improved schema v2
    const documentData = {
      userId: userId,
      query: searchQuery.substring(0, 1000),
      title: title?.substring(0, 500) || '',
      resultType: 'search',
      slug: slug || '',
      articleUrl: selectedArticle?.url || '',
      articleTitle: selectedArticle?.title?.substring(0, 500) || '',
      timestamp: new Date().toISOString(),
    };
    
    await retryOperation(() =>
      databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.SEARCH_HISTORY,
        ID.unique(),
        documentData
      )
    );
    console.log('✅ Search saved to history successfully');
    
    // Trigger a custom event to refresh search history
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('refreshSearchHistory'));
    }
  } catch (error) {
    console.error('❌ Error saving search to history:', error);
    // Don't throw - allow the app to continue working
  }
};

// Save verification to search history (single source of truth for user history)
export const saveVerificationToHistory = async (
  userId: string,
  searchQuery: string,
  newsContent: string,
  result: VerificationResult,
  selectedArticle?: NewsArticle | null,
  slug?: string,
  title?: string
) => {
  console.log('🔍 saveVerificationToHistory called:', { userId, searchQuery, configured: isAppwriteConfigured() });
  
  if (!userId || !isAppwriteConfigured()) {
    console.warn('❌ saveVerificationToHistory aborted - missing userId or Appwrite not configured');
    return;
  }
  
  try {
    console.log('💾 Attempting to save verification to history...');

    // Improved schema v2 - lightweight history entry with denormalized result preview
    const documentData = removeUndefined({
      userId: userId,
      query: searchQuery.substring(0, 1000),
      title: title?.substring(0, 500) || '',
      resultType: 'verification',
      slug: slug || '',
      
      // Denormalized for quick preview without fetching full verification
      veracity: result.veracity,
      confidence: result.confidence,
      
      // Source article
      articleUrl: selectedArticle?.url || '',
      articleTitle: selectedArticle?.title?.substring(0, 500) || '',
      
      timestamp: new Date().toISOString(),
    });

    await retryOperation(() =>
      databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.SEARCH_HISTORY,
        ID.unique(),
        documentData
      )
    );
    console.log('✅ Verification saved to history successfully');
    
    // Trigger a custom event to refresh search history
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('refreshSearchHistory'));
    }
  } catch (error) {
    console.error('❌ Error saving verification to search history:', error);
    // Don't throw - allow the app to continue working
  }
};

// Get user's search history with pagination support
export const getUserSearchHistory = async (
  userId: string, 
  limit: number = 50,
  offset: number = 0
): Promise<{ items: SearchHistoryItem[]; total: number }> => {
  if (!userId || !isAppwriteConfigured()) {
    console.log('getUserSearchHistory: No userId or Appwrite not configured');
    return { items: [], total: 0 };
  }
  
  try {
    console.log('🔍 Fetching search history for user:', userId);
    return await retryOperation(async () => {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SEARCH_HISTORY,
        [
          Query.equal('userId', userId),
          Query.orderDesc('timestamp'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );
      
      console.log('📊 Found', response.documents.length, 'search history documents');
      
      const history: SearchHistoryItem[] = response.documents.map((doc) => ({
        id: doc.$id,
        query: doc.query,
        title: doc.title,
        timestamp: doc.timestamp,
        articleUrl: doc.articleUrl,
        articleTitle: doc.articleTitle,
        resultType: doc.resultType,
        slug: doc.slug,
        veracity: doc.veracity,
        confidence: doc.confidence,
      }));
      
      console.log('✅ Returning', history.length, 'search history items');
      return { items: history, total: response.total };
    });
  } catch (error) {
    console.error('❌ Error getting user search history:', error);
    return { items: [], total: 0 };
  }
};

// Get user's history filtered by type
export const getUserHistoryByType = async (
  userId: string,
  type: 'search' | 'verification',
  limit: number = 50
): Promise<SearchHistoryItem[]> => {
  if (!userId || !isAppwriteConfigured()) {
    return [];
  }
  
  try {
    const response = await retryOperation(() =>
      databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SEARCH_HISTORY,
        [
          Query.equal('userId', userId),
          Query.equal('resultType', type),
          Query.orderDesc('timestamp'),
          Query.limit(limit)
        ]
      )
    );
    
    return response.documents.map((doc) => ({
      id: doc.$id,
      query: doc.query,
      title: doc.title,
      timestamp: doc.timestamp,
      articleUrl: doc.articleUrl,
      articleTitle: doc.articleTitle,
      resultType: doc.resultType,
      slug: doc.slug,
      veracity: doc.veracity,
      confidence: doc.confidence,
    }));
  } catch (error) {
    console.error('❌ Error getting user history by type:', error);
    return [];
  }
};

// Delete a search history item
export const deleteSearchHistoryItem = async (userId: string, itemId: string): Promise<boolean> => {
  if (!userId || !itemId || !isAppwriteConfigured()) {
    return false;
  }
  
  try {
    // First verify the item belongs to the user
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.SEARCH_HISTORY, itemId);
    if (doc.userId !== userId) {
      console.error('❌ Unauthorized: Item does not belong to user');
      return false;
    }
    
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.SEARCH_HISTORY, itemId);
    console.log('✅ Search history item deleted successfully');
    
    // Trigger refresh event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('refreshSearchHistory'));
    }
    return true;
  } catch (error) {
    console.error('❌ Error deleting search history item:', error);
    return false;
  }
};

// Clear all search history for a user
export const clearUserSearchHistory = async (userId: string): Promise<boolean> => {
  if (!userId || !isAppwriteConfigured()) {
    return false;
  }
  
  try {
    // Get all user's history items
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SEARCH_HISTORY,
      [
        Query.equal('userId', userId),
        Query.limit(100) // Process in batches
      ]
    );
    
    // Delete all items
    const deletePromises = response.documents.map(doc => 
      databases.deleteDocument(DATABASE_ID, COLLECTIONS.SEARCH_HISTORY, doc.$id)
    );
    
    await Promise.all(deletePromises);
    console.log('✅ All search history cleared successfully');
    
    // Trigger refresh event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('refreshSearchHistory'));
    }
    return true;
  } catch (error) {
    console.error('❌ Error clearing search history:', error);
    return false;
  }
};

// Check if Appwrite is accessible
export const checkAppwriteConnectivity = async (): Promise<boolean> => {
  if (!isAppwriteConfigured()) {
    console.warn('🔥 Appwrite not configured');
    return false;
  }
  
  try {
    // Try a simple list operation to check connectivity
    await databases.listDocuments(DATABASE_ID, COLLECTIONS.VERIFICATIONS, [Query.limit(1)]);
    console.log('✅ Appwrite connectivity check passed');
    return true;
  } catch (error: unknown) {
    const appwriteError = error as AppwriteError;
    console.warn('❌ Appwrite connectivity check failed:', error);
    
    if (appwriteError.message?.includes('ERR_BLOCKED_BY_CLIENT') || 
        appwriteError.message?.includes('Failed to fetch')) {
      console.warn('🚫 Appwrite appears to be blocked by ad blocker');
    }
    
    return false;
  }
};

// Get recent public verifications (for feed/discovery)
export const getRecentVerifications = async (
  limit: number = 20,
  veracityFilter?: string
): Promise<VerificationDocument[]> => {
  if (!isAppwriteConfigured()) {
    return [];
  }
  
  try {
    const queries = [
      Query.equal('isPublic', true),
      Query.orderDesc('timestamp'),
      Query.limit(limit)
    ];
    
    if (veracityFilter) {
      queries.push(Query.equal('veracity', veracityFilter));
    }
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.VERIFICATIONS,
      queries
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
    }));
  } catch (error) {
    console.error('❌ Error getting recent verifications:', error);
    return [];
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
      console.error('❌ Unauthorized: Verification does not belong to user');
      return false;
    }
    
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.VERIFICATIONS,
      doc.$id,
      { isPublic }
    );
    
    console.log(`✅ Verification privacy updated to ${isPublic ? 'public' : 'private'}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating verification privacy:', error);
    return false;
  }
};

// Alias for backwards compatibility
export const checkFirestoreConnectivity = checkAppwriteConnectivity;

import { Query, ID } from 'appwrite';
import { 
  databases, 
  DATABASE_ID, 
  COLLECTIONS, 
  isAppwriteConfigured, 
  retryOperation, 
  removeUndefined 
} from './base';
import { VerificationResult, NewsArticle, SearchHistoryItem } from '@/types/news';
import { queryCache } from '@/lib/queryCache';
import { logger } from '@/lib/logger';

// Save search query to user's search history
export const saveSearchToHistory = async (
  userId: string,
  searchQuery: string,
  selectedArticle?: NewsArticle | null,
  slug?: string,
  title?: string
) => {
  if (!userId || !isAppwriteConfigured()) {
    logger.warn('saveSearchToHistory aborted - missing userId or Appwrite not configured');
    return;
  }
  
  try {
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
    
    // Trigger a custom event to refresh search history
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('refreshSearchHistory'));
    }
  } catch (error) {
    logger.error('Error saving search to history:', error);
  }
};

// Save verification to search history (single source of truth for user history)
export const saveVerificationToHistory = async (
  userId: string,
  searchQuery: string,
  result: VerificationResult,
  selectedArticle?: NewsArticle | null,
  slug?: string,
  title?: string
) => {
  if (!userId || !isAppwriteConfigured()) {
    logger.warn('saveVerificationToHistory aborted - missing userId or Appwrite not configured');
    return;
  }
  
  try {
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
    
    // Trigger a custom event to refresh search history
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('refreshSearchHistory'));
    }
  } catch (error) {
    logger.error('Error saving verification to search history:', error);
  }
};

// Get user's search history with pagination support
export const getUserSearchHistory = async (
  userId: string, 
  limit: number = 50,
  offset: number = 0
): Promise<{ items: SearchHistoryItem[]; total: number }> => {
  if (!userId || !isAppwriteConfigured()) {
    logger.info('getUserSearchHistory: No userId or Appwrite not configured');
    return { items: [], total: 0 };
  }
  
  const cacheKey = `history:${userId}:${limit}:${offset}`;
  const cached = queryCache.get<{ items: SearchHistoryItem[]; total: number }>(cacheKey);
  if (cached) return cached;

  try {
    const result = await retryOperation(async () => {
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
      
      return { items: history, total: response.total };
    });

    queryCache.set(cacheKey, result);
    return result;
  } catch (error) {
    logger.error('Error getting user search history:', error);
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
  
  const cacheKey = `history:${userId}:${type}:${limit}`;
  const cached = queryCache.get<SearchHistoryItem[]>(cacheKey);
  if (cached) return cached;

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
    
    const history = response.documents.map((doc) => ({
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

    queryCache.set(cacheKey, history);
    return history;
  } catch (error) {
    logger.error('Error getting user history by type:', error);
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
      logger.error('Unauthorized: Item does not belong to user');
      return false;
    }
    
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.SEARCH_HISTORY, itemId);
    logger.info('Search history item deleted successfully');
    
    // Trigger refresh event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('refreshSearchHistory'));
    }
    return true;
  } catch (error) {
    logger.error('Error deleting search history item:', error);
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
    logger.info('All search history cleared successfully');
    
    // Trigger refresh event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('refreshSearchHistory'));
    }
    return true;
  } catch (error) {
    logger.error('Error clearing search history:', error);
    return false;
  }
};

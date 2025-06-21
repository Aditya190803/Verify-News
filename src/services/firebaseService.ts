
import { doc, updateDoc, arrayUnion, collection, addDoc, serverTimestamp, getDoc, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { VerificationResult, NewsArticle } from '@/types/news';

// Type for search history item
export interface SearchHistoryItem {
  id?: string;
  query: string;
  timestamp: string;
  articleUrl?: string;
  articleTitle?: string;
  resultType?: 'search' | 'verification';
}

// Utility function to retry Firestore operations
const retryOperation = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.warn(`Firestore operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      // Don't retry if it's a permission error or if db is null
      if (!db || error.code === 'permission-denied' || error.code === 'unauthenticated') {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError;
};

export const saveVerificationToUserHistory = async (
  userId: string, 
  searchQuery: string,
  newsContent: string,
  result: VerificationResult,
  selectedArticle?: NewsArticle | null
) => {
  if (!userId || !db) return;
  
  try {
    await retryOperation(() => 
      updateDoc(doc(db, 'users', userId), {
        verificationHistory: arrayUnion({
          query: searchQuery,
          content: newsContent,
          articleUrl: selectedArticle?.url || '',
          result: result,
          timestamp: new Date().toISOString()
        })
      })
    );
  } catch (error) {
    console.error('Error saving verification to user history:', error);
    // Don't throw - allow the app to continue working
  }
};

export const saveVerificationToCollection = async (
  searchQuery: string,
  newsContent: string,
  result: VerificationResult,
  userId: string = 'anonymous',
  selectedArticle?: NewsArticle | null
) => {
  if (!db) return;
  
  try {
    await retryOperation(() =>
      addDoc(collection(db, 'verifications'), {
        query: searchQuery,
        content: newsContent,
        articleUrl: selectedArticle?.url || '',
        result: result,
        userId: userId,
        timestamp: serverTimestamp()
      })
    );
  } catch (error) {
    console.error('Error saving verification to collection:', error);
    // Don't throw - allow the app to continue working
  }
};

// Save search query to user's search history
export const saveSearchToHistory = async (
  userId: string,
  searchQuery: string,
  selectedArticle?: NewsArticle | null
) => {
  console.log('🔍 saveSearchToHistory called:', { userId, searchQuery, hasDB: !!db });
  
  if (!userId || !db) {
    console.warn('❌ saveSearchToHistory aborted - missing userId or db:', { userId: !!userId, db: !!db });
    return;
  }
  
  try {
    console.log('💾 Attempting to save search to history...');
    await retryOperation(() =>
      addDoc(collection(db, 'searchHistory'), {
        userId: userId,
        query: searchQuery,
        articleUrl: selectedArticle?.url || '',
        articleTitle: selectedArticle?.title || '',
        resultType: 'search',
        timestamp: serverTimestamp()
      })
    );
    console.log('✅ Search saved to history successfully');
  } catch (error) {
    console.error('❌ Error saving search to history:', error);
    // Don't throw - allow the app to continue working
  }
};

// Save verification to search history
export const saveVerificationToHistory = async (
  userId: string,
  searchQuery: string,
  newsContent: string,
  result: VerificationResult,
  selectedArticle?: NewsArticle | null
) => {
  console.log('🔍 saveVerificationToHistory called:', { userId, searchQuery, hasDB: !!db });
  
  if (!userId || !db) {
    console.warn('❌ saveVerificationToHistory aborted - missing userId or db:', { userId: !!userId, db: !!db });
    return;
  }
  
  try {
    console.log('💾 Attempting to save verification to history...');
    await retryOperation(() =>
      addDoc(collection(db, 'searchHistory'), {
        userId: userId,
        query: searchQuery,
        content: newsContent,
        articleUrl: selectedArticle?.url || '',
        articleTitle: selectedArticle?.title || '',
        result: result,
        resultType: 'verification',
        timestamp: serverTimestamp()
      })
    );
    console.log('✅ Verification saved to history successfully');
  } catch (error) {
    console.error('❌ Error saving verification to search history:', error);
    // Don't throw - allow the app to continue working
  }
};

// Get user's search history
export const getUserSearchHistory = async (userId: string): Promise<SearchHistoryItem[]> => {
  if (!userId || !db) return [];
  
  try {
    return await retryOperation(async () => {
      const q = query(
        collection(db, 'searchHistory'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(50) // Limit to last 50 searches
      );
      
      const querySnapshot = await getDocs(q);
      const history: SearchHistoryItem[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        history.push({
          id: doc.id,
          query: data.query,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
          articleUrl: data.articleUrl,
          articleTitle: data.articleTitle,
          resultType: data.resultType
        });
      });
      
      return history;
    });
  } catch (error) {
    console.error('Error getting user search history:', error);
    return [];
  }
};

// Fetch a verification result by slug
export const getVerificationBySlug = async (slug: string) => {
  if (!db || !slug) return null;
  try {
    const q = query(collection(db, 'verifications'), where('slug', '==', slug), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.log('No document found for slug:', slug);
      return null;
    }
    const docSnap = querySnapshot.docs[0];
    const data = { id: docSnap.id, ...docSnap.data() };
    console.log('Found document for slug:', slug, data);
    return data;
  } catch (error) {
    console.error('Error fetching verification by slug:', error);
    return null;
  }
};

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
  slug?: string;
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
  selectedArticle?: NewsArticle | null,
  slug?: string,
  title?: string
) => {
  if (!userId || !db) return;
  
  try {
    console.log('💾 Attempting to save verification to user profile...');
    
    // Helper function to remove undefined values recursively
    const removeUndefined = (obj: any): any => {
      if (obj === null || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(removeUndefined);
      
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = removeUndefined(value);
        }
      }
      return cleaned;
    };

    // Clean the result object to remove undefined values
    const cleanResult = removeUndefined({
      veracity: result.veracity,
      confidence: result.confidence,
      explanation: result.explanation,
      sources: result.sources,
      correctedInfo: result.correctedInfo
    });

    // Clean the entire history entry
    const historyEntry = removeUndefined({
      query: searchQuery,
      content: newsContent,
      articleUrl: selectedArticle?.url || '',
      result: cleanResult,
      timestamp: new Date().toISOString(),
      slug: slug,
      title: title
    });

    await retryOperation(() => 
      updateDoc(doc(db, 'users', userId), {
        verificationHistory: arrayUnion(historyEntry)
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
  selectedArticle?: NewsArticle | null,
  slug?: string,
  title?: string
) => {
  if (!db) return;
  
  try {
    // Helper function to remove undefined values recursively
    const removeUndefined = (obj: any): any => {
      if (obj === null || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(removeUndefined);
      
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = removeUndefined(value);
        }
      }
      return cleaned;
    };

    // Clean the result object to remove undefined values
    const cleanResult = removeUndefined({
      veracity: result.veracity,
      confidence: result.confidence,
      explanation: result.explanation,
      sources: result.sources,
      correctedInfo: result.correctedInfo
    });

    // Clean the entire document
    const documentData = removeUndefined({
      query: searchQuery,
      content: newsContent,
      articleUrl: selectedArticle?.url || '',
      result: cleanResult,
      userId: userId,
      timestamp: serverTimestamp(),
      slug: slug,
      title: title
    });

    await retryOperation(() =>
      addDoc(collection(db, 'verifications'), documentData)
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
  selectedArticle?: NewsArticle | null,
  slug?: string,
  title?: string
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
        userEmail: (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('userEmail')) || null,
        query: searchQuery,
        articleUrl: selectedArticle?.url || '',
        articleTitle: selectedArticle?.title || '',
        resultType: 'search',
        timestamp: serverTimestamp(),
        slug: slug || null,
        title: title || null
      })
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

// Save verification to search history
export const saveVerificationToHistory = async (
  userId: string,
  searchQuery: string,
  newsContent: string,
  result: VerificationResult,
  selectedArticle?: NewsArticle | null,
  slug?: string,
  title?: string
) => {
  console.log('🔍 saveVerificationToHistory called:', { userId, searchQuery, hasDB: !!db });
  
  if (!userId || !db) {
    console.warn('❌ saveVerificationToHistory aborted - missing userId or db:', { userId: !!userId, db: !!db });
    return;
  }
  
  try {
    console.log('💾 Attempting to save verification to history...');
    
    // Helper function to remove undefined values recursively
    const removeUndefined = (obj: any): any => {
      if (obj === null || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(removeUndefined);
      
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = removeUndefined(value);
        }
      }
      return cleaned;
    };

    // Clean the result object to remove undefined values
    const cleanResult = removeUndefined({
      veracity: result.veracity,
      confidence: result.confidence,
      explanation: result.explanation,
      sources: result.sources,
      correctedInfo: result.correctedInfo
    });

    // Clean the entire document
    const documentData = removeUndefined({
      userId: userId,
      userEmail: (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('userEmail')),
      query: searchQuery,
      content: newsContent,
      articleUrl: selectedArticle?.url || '',
      articleTitle: selectedArticle?.title || '',
      result: cleanResult,
      resultType: 'verification',
      timestamp: serverTimestamp(),
      slug: slug,
      title: title
    });

    await retryOperation(() =>
      addDoc(collection(db, 'searchHistory'), documentData)
    );
    console.log('✅ Verification saved to history successfully');
    
    // Import and call the global refresh function
    if (typeof window !== 'undefined') {
      // Trigger a custom event to refresh search history
      window.dispatchEvent(new CustomEvent('refreshSearchHistory'));
    }
  } catch (error) {
    console.error('❌ Error saving verification to search history:', error);
    // Don't throw - allow the app to continue working
  }
};

// Get user's search history
export const getUserSearchHistory = async (userId: string): Promise<SearchHistoryItem[]> => {
  if (!userId || !db) {
    console.log('getUserSearchHistory: No userId or db', { userId: !!userId, db: !!db });
    return [];
  }
  
  try {
    console.log('🔍 Fetching search history for user:', userId);
    return await retryOperation(async () => {
      // Get all search history documents for the user (without ordering to avoid index requirement)
      const q = query(
        collection(db, 'searchHistory'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const history: SearchHistoryItem[] = [];
      
      console.log('📊 Found', querySnapshot.size, 'search history documents');
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📝 Search history item:', data);
        let isoTimestamp = new Date().toISOString();
        if (data.timestamp) {
          if (typeof data.timestamp.toDate === 'function') {
            isoTimestamp = data.timestamp.toDate().toISOString();
          } else if (typeof data.timestamp === 'string') {
            isoTimestamp = data.timestamp;
          }
        }
        history.push({
          id: doc.id,
          query: data.query,
          timestamp: isoTimestamp,
          articleUrl: data.articleUrl,
          articleTitle: data.articleTitle,
          resultType: data.resultType,
          slug: data.slug
        });
      });
      
      // Sort by timestamp descending on the client side and limit to 50
      history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      console.log('✅ Returning', Math.min(history.length, 50), 'search history items');
      return history.slice(0, 50);
    });
  } catch (error) {
    console.error('❌ Error getting user search history:', error);
    return [];
  }
};

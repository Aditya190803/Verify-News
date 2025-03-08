
import { doc, updateDoc, arrayUnion, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { VerificationResult, NewsArticle } from '@/types/news';

export const saveVerificationToUserHistory = async (
  userId: string, 
  searchQuery: string,
  newsContent: string,
  result: VerificationResult,
  selectedArticle?: NewsArticle | null
) => {
  if (!userId) return;
  
  try {
    await updateDoc(doc(db, 'users', userId), {
      verificationHistory: arrayUnion({
        query: searchQuery,
        content: newsContent,
        articleUrl: selectedArticle?.url || '',
        result: result,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Error saving verification to user history:', error);
    throw error;
  }
};

export const saveVerificationToCollection = async (
  searchQuery: string,
  newsContent: string,
  result: VerificationResult,
  userId: string = 'anonymous',
  selectedArticle?: NewsArticle | null
) => {
  try {
    await addDoc(collection(db, 'verifications'), {
      query: searchQuery,
      content: newsContent,
      articleUrl: selectedArticle?.url || '',
      result: result,
      userId: userId,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving verification to collection:', error);
    throw error;
  }
};

import { databases, storage, DATABASE_ID, BUCKET_ID, COLLECTIONS, Query } from '../../config/appwrite';
import { AppwriteError } from '@/types/news';
import { logger } from '@/lib/logger';

// Check if Appwrite is configured
export const isAppwriteConfigured = (): boolean => {
  return !!import.meta.env.VITE_APPWRITE_PROJECT_ID &&
         !!import.meta.env.VITE_APPWRITE_DATABASE_ID &&
         !!import.meta.env.VITE_APPWRITE_ENDPOINT;
};

// Validate Appwrite configuration at startup
export const validateAppwriteConfig = (): void => {
  const errors: string[] = [];
  
  if (!import.meta.env.VITE_APPWRITE_PROJECT_ID) {
    errors.push('VITE_APPWRITE_PROJECT_ID is not configured');
  } else if (import.meta.env.VITE_APPWRITE_PROJECT_ID === 'your-project-id') {
    errors.push('VITE_APPWRITE_PROJECT_ID is using default value - please set a real project ID');
  }
  
  if (!import.meta.env.VITE_APPWRITE_ENDPOINT) {
    errors.push('VITE_APPWRITE_ENDPOINT is not configured');
  } else if (import.meta.env.VITE_APPWRITE_ENDPOINT === 'https://cloud.appwrite.io/v1') {
    errors.push('VITE_APPWRITE_ENDPOINT is using default value - please set your actual endpoint');
  }
  
  if (!import.meta.env.VITE_APPWRITE_DATABASE_ID) {
    errors.push('VITE_APPWRITE_DATABASE_ID is not configured');
  }
  
  if (errors.length > 0) {
    const errorMessage = `❌ Appwrite configuration errors:\n${errors.map(e => `  - ${e}`).join('\n')}`;
    logger.error(errorMessage);
    
    if (import.meta.env.PROD) {
      throw new Error(errorMessage);
    }
  } else {
    logger.info('✅ Appwrite configuration validated successfully');
  }
};

// Utility function to retry Appwrite operations with better error handling
export const retryOperation = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
  let lastError: unknown = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      const appwriteError = error as AppwriteError;
      lastError = error;
      logger.warn(`Appwrite operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      // Don't retry if it's a permission error
      if (appwriteError.code === 401 || appwriteError.code === 403) {
        throw error;
      }
      
      // Handle network/connectivity errors
      if (appwriteError.message?.includes('ERR_BLOCKED_BY_CLIENT') || 
          appwriteError.message?.includes('Failed to fetch') ||
          appwriteError.message?.includes('NetworkError')) {
        logger.warn(`🚫 Network error detected: ${appwriteError.message}`);
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
  
  throw lastError as Error;
};

// Helper function to remove undefined values recursively
export const removeUndefined = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefined) as unknown as T;
  
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (value !== undefined) {
      cleaned[key] = removeUndefined(value);
    }
  }
  return cleaned as T;
};

export const checkAppwriteConnectivity = async (): Promise<boolean> => {
  try {
    // Validate configuration first
    validateAppwriteConfig();
    
    if (!isAppwriteConfigured()) return false;
    
    await databases.listDocuments(DATABASE_ID, COLLECTIONS.VERIFICATIONS, [Query.limit(1)]);
    return true;
  } catch (error) {
    logger.error('Appwrite connectivity check failed:', error);
    return false;
  }
};

export { databases, storage, DATABASE_ID, BUCKET_ID, COLLECTIONS };

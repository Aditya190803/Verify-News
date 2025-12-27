/**
 * VerifyNews Public API Service
 * 
 * This service provides a clean interface for third-party integrations.
 * In a production environment, these would call a backend API.
 * For this demonstration, it wraps our internal verification logic.
 */

import { verifyWithFallback, verifyMediaWithGemini } from '@/services/aiProviders';
import { comprehensiveNewsSearch } from '@/utils/searchUtils';
import { VerificationResult, MediaFile, SearchResponse } from '@/types/news';
import { saveVerificationToCollection } from '@/services/appwrite';
import { logger } from '@/lib/logger';

export interface ApiOptions {
  apiKey?: string;
  includeSearchContext?: boolean;
  saveToGlobalHistory?: boolean;
}

export const VerifyNewsAPI = {
  /**
   * Verify a piece of text or a URL
   */
  verifyText: async (
    text: string, 
    options: ApiOptions = {}
  ): Promise<VerificationResult> => {
    const { includeSearchContext = true, saveToGlobalHistory = true } = options;
    
    try {
      let searchResults: SearchResponse[] = [];
      if (includeSearchContext) {
        searchResults = await comprehensiveNewsSearch(text);
      }
      
      const result = await verifyWithFallback(text, searchResults);
      
      if (saveToGlobalHistory) {
        // Save to global collection as an anonymous API call
        await saveVerificationToCollection(
          text,
          text,
          result,
          'api-client',
          null,
          Math.random().toString(36).substring(2, 10),
          `API Verification: ${text.substring(0, 30)}...`
        );
      }
      
      return result;
    } catch (error) {
      logger.error('API Error (verifyText):', error);
      throw new Error('Verification failed. Please check your input and try again.');
    }
  },

  /**
   * Verify a media file (image/video)
   */
  verifyMedia: async (
    media: MediaFile,
    contextText?: string,
    options: ApiOptions = {}
  ): Promise<VerificationResult> => {
    const { includeSearchContext = true, saveToGlobalHistory = true } = options;
    
    try {
      let searchResults: SearchResponse[] = [];
      if (includeSearchContext && contextText) {
        searchResults = await comprehensiveNewsSearch(contextText);
      }
      
      const result = await verifyMediaWithGemini(media, contextText, searchResults);
      
      if (saveToGlobalHistory) {
        await saveVerificationToCollection(
          contextText || media.file.name,
          `[${media.type.toUpperCase()}] ${media.file.name}`,
          result,
          'api-client',
          null,
          Math.random().toString(36).substring(2, 10),
          `API Media Verification: ${media.file.name}`
        );
      }
      
      return result;
    } catch (error) {
      logger.error('API Error (verifyMedia):', error);
      throw new Error('Media verification failed.');
    }
  }
};

export default VerifyNewsAPI;

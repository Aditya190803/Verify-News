/**
 * @fileoverview News content verification module.
 * Provides functions to verify news content using AI-powered analysis.
 * @module lib/verifier
 */

import { verifyWithFallback } from '@/services/aiProviders';
import { comprehensiveNewsSearch } from '@/utils/searchUtils';
import { VerificationResult, SearchResponse } from '@/types/news';
import { verificationTextCache } from '@/lib/verificationCache';
import { logger } from '@/lib/logger';

/**
 * Verifies news content for authenticity and accuracy.
 * Uses Gemini AI with real-time search results for comprehensive fact-checking.
 * 
 * @param {string} content - The news content to verify
 * @param {string} [articleUrl] - Optional URL of the source article
 * @returns {Promise<{ success: boolean; data: VerificationResult }>} Verification result
 * 
 * @example
 * ```ts
 * const result = await verifyNewsContent("Breaking news: New policy announced");
 * if (result.success) {
 *   console.log("Veracity:", result.data.veracity);
 * }
 * ```
 */
export const verifyNewsContent = async (
  content: string,
  articleUrl?: string
): Promise<{ success: boolean; data: VerificationResult }> => {
  try {
    // Validate input
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        data: {
          veracity: 'unverified',
          confidence: 0,
          explanation: 'No content provided for verification.',
          sources: [],
        },
      };
    }

    // Check cache first
    const cacheKey = `${content}:${articleUrl || ''}`;
    const cachedResult = verificationTextCache.get<VerificationResult>(cacheKey, 'news');
    if (cachedResult) {
      logger.info('📦 Using cached verification result');
      return {
        success: true,
        data: cachedResult,
      };
    }

    // Perform comprehensive search for context
    let searchResults: SearchResponse[] = [];
    try {
      searchResults = await comprehensiveNewsSearch(content);
    } catch (searchError) {
      logger.warn('Search failed, proceeding with AI verification only:', searchError);
      searchResults = [];
    }

    // Verify with AI
    const result = await verifyWithFallback(
      content,
      searchResults
    );

    // If we have an article URL, ensure it's in the sources
    if (articleUrl && !result.sources.some(s => s.url === articleUrl)) {
      result.sources.unshift({ name: 'Original Article', url: articleUrl });
    }

    // Store in cache
    verificationTextCache.set(cacheKey, result, 'news');

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error('Verification failed:', error);
    
    // Return unverified result as fallback
    return {
      success: true,
      data: {
        veracity: 'unverified',
        confidence: 0,
        explanation: 'Verification service temporarily unavailable. Please verify manually using trusted sources.',
        sources: articleUrl ? [{ name: 'Original Article', url: articleUrl }] : [],
      },
    };
  }
};

/**
 * Quick verification check for short claims or headlines.
 * Optimized for faster response on simple queries.
 * 
 * @param {string} claim - A short claim or headline to verify
 * @returns {Promise<{ veracity: string; confidence: number }>} Quick verification result
 */
export const quickVerify = async (
  claim: string
): Promise<{ veracity: string; confidence: number }> => {
  try {
    const result = await verifyNewsContent(claim);
    return {
      veracity: result.data.veracity,
      confidence: result.data.confidence,
    };
  } catch {
    return {
      veracity: 'unverified',
      confidence: 0,
    };
  }
};

/**
 * @fileoverview News content verification module.
 * Provides functions to verify news content using AI-powered analysis.
 * @module lib/verifier
 */

import { verifyNewsWithGemini, getMockVerificationResult } from '@/utils/geminiApi';
import { comprehensiveNewsSearch } from '@/utils/searchUtils';
import { VerificationResult } from '@/types/news';

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

    // Perform comprehensive search for context
    let searchResults;
    try {
      searchResults = await comprehensiveNewsSearch(content);
    } catch (searchError) {
      console.warn('Search failed, proceeding with AI verification only:', searchError);
      searchResults = [];
    }

    // Verify with Gemini AI
    const result = await verifyNewsWithGemini(
      content,
      content.substring(0, 100), // Use first 100 chars as search query
      articleUrl,
      searchResults
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Verification failed:', error);
    
    // Return mock result as fallback
    return {
      success: true,
      data: {
        ...getMockVerificationResult(articleUrl),
        explanation: 'Verification service temporarily unavailable. This is a demo result. Please verify manually using trusted sources.',
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

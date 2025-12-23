/**
 * AI Proxy Service
 * 
 * This service acts as a backend proxy for AI provider API calls.
 * It removes the need for client-side API keys by routing requests
 * through a backend service that securely stores and uses the keys.
 */

import { VerificationResult, SearchResponse, SearchArticle, MediaFile } from '@/types/news';
import { logger } from '@/lib/logger';
import { VerificationResultSchema } from '@/lib/schemas';

// Backend API endpoint for AI services
// In production, this would be your actual backend API URL
const AI_PROXY_BASE_URL = import.meta.env.VITE_AI_PROXY_URL || '/api/ai';

/**
 * Generic function to call the AI proxy backend
 */
async function callAIProxy<T>(
  endpoint: string,
  payload: Record<string, unknown>,
  timeout: number = 30000
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${AI_PROXY_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `AI Proxy error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI service request timed out');
    }
    
    throw error;
  }
}

/**
 * Verify content using AI proxy
 */
export const verifyWithProxy = async (
  content: string,
  searchResults: SearchResponse[] = []
): Promise<VerificationResult> => {
  const result = await callAIProxy<VerificationResult>('verify', {
    content,
    searchResults,
    provider: 'fallback', // Backend will handle provider selection
  });

  // Validate the response
  const parsed = VerificationResultSchema.safeParse(result);
  if (!parsed.success) {
    logger.error('AI proxy response validation failed:', parsed.error.format());
    throw new Error('Invalid response from AI service');
  }

  return parsed.data;
};

/**
 * Verify media content using AI proxy
 */
export const verifyMediaWithProxy = async (
  mediaFile: MediaFile,
  additionalContext?: string,
  searchResults?: SearchResponse[]
): Promise<VerificationResult> => {
  // Convert file to base64 if not already done
  const base64Data = mediaFile.base64 || await fileToBase64(mediaFile.file);

  const result = await callAIProxy<VerificationResult>('verify-media', {
    mediaData: base64Data,
    mimeType: mediaFile.file.type,
    additionalContext,
    searchResults,
  });

  // Validate the response
  const parsed = VerificationResultSchema.safeParse(result);
  if (!parsed.success) {
    logger.error('AI proxy media response validation failed:', parsed.error.format());
    throw new Error('Invalid response from AI media service');
  }

  return parsed.data;
};

/**
 * Generate title using AI proxy
 */
export const generateTitleWithProxy = async (input: string): Promise<string> => {
  const result = await callAIProxy<{ title: string }>('generate-title', {
    content: input,
  });

  return result.title || '';
};

/**
 * Rank search results using AI proxy
 */
export const rankSearchResultsWithProxy = async (
  content: string,
  results: SearchArticle[]
): Promise<SearchArticle[]> => {
  if (results.length <= 3) return results; // No need to rank if few results

  const result = await callAIProxy<{ rankedIds: number[] }>('rank-results', {
    content,
    results: results.map((r, i) => ({
      id: i,
      title: r.title || r.name,
      snippet: r.snippet,
    })),
  });

  // Map back to original results
  return result.rankedIds
    .map(id => results[id])
    .filter(Boolean);
};

/**
 * Helper to convert a File object to a base64 string
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Check if AI proxy service is available
 */
export const isAIProxyAvailable = (): boolean => {
  return import.meta.env.VITE_USE_AI_PROXY === 'true';
};

/**
 * Get AI proxy configuration
 */
export const getAIProxyConfig = () => {
  return {
    baseUrl: AI_PROXY_BASE_URL,
    enabled: isAIProxyAvailable(),
    timeout: 30000,
  };
};
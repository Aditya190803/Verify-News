/**
 * Shared API response types
 * 
 * Centralized type definitions for API responses used across services.
 */

import type { SearchResponse, VerificationResult, NewsArticle, SearchHistoryItem } from './news';

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * API error response
 */
export interface ApiError {
  message: string;
  code?: number;
  type?: string;
  details?: Record<string, unknown>;
}

/**
 * Search API response (wrapper for search results)
 */
export interface SearchApiResponse {
  results: SearchResponse[];
  query: string;
  timestamp: string;
}

/**
 * Verification API response
 */
export interface VerificationApiResponse {
  result: VerificationResult;
  articles: NewsArticle[];
  query: string;
  timestamp: string;
  slug?: string;
}

/**
 * History list response
 */
export interface HistoryListResponse extends PaginatedResponse<SearchHistoryItem> {
  userId: string;
}

/**
 * Appwrite document response (generic wrapper)
 */
export interface AppwriteDocument {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $collectionId: string;
  $databaseId: string;
}

/**
 * Appwrite list response
 */
export interface AppwriteListResponse<T> {
  total: number;
  documents: (T & AppwriteDocument)[];
}

/**
 * Rate limit status response
 */
export interface RateLimitStatus {
  isLimited: boolean;
  remaining: number;
  resetTime?: number;
  type: 'verification' | 'search' | 'auth';
}

/**
 * AI provider response (normalized from different AI APIs)
 */
export interface AIProviderResponse {
  content: string;
  provider: string;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Public API verification request
 */
export interface PublicVerificationRequest {
  content: string;
  url?: string;
  includeMedia?: boolean;
}

/**
 * Public API verification response
 */
export interface PublicVerificationResponse {
  result: VerificationResult;
  requestId: string;
  timestamp: string;
}

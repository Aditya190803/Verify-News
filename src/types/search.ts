/**
 * @fileoverview Type definitions for search and API responses.
 * @module types/search
 */

/** Represents a search result article from LangSearch API */
export interface SearchArticle {
  name?: string;
  title?: string;
  snippet?: string;
  url?: string;
  displayUrl?: string;
  summary?: string;
  datePublished?: string;
  dateLastCrawled?: string;
}

/** Represents the structured search response from LangSearch */
export interface SearchResponse {
  _type?: string;
  queryContext?: {
    originalQuery: string;
  };
  webPages?: {
    webSearchUrl?: string;
    totalEstimatedMatches?: number | null;
    value: SearchArticle[];
  };
  results?: SearchArticle[];
  value?: SearchArticle[];
  data?: {
    webPages?: {
      value: SearchArticle[];
    };
  };
  error?: string;
  message?: string;
}

/** Appwrite error type with code */
export interface AppwriteError extends Error {
  code?: number;
  type?: string;
}

/** Generic record type for cleaned objects */
export type CleanedObject = Record<string, unknown>;

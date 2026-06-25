/** Verification + search types (shared web ↔ API). */

export type VerificationStatus =
  | 'idle'
  | 'searching'
  | 'ranking'
  | 'verifying'
  | 'verified'
  | 'error';

export type NewsVeracity =
  | 'true'
  | 'false'
  | 'unverified'
  | 'partially-true'
  | 'verified'
  | 'misleading';

export type MediaType = 'image' | 'audio' | 'video' | 'text';

export interface VerificationResult {
  id?: string;
  veracity: NewsVeracity;
  confidence: number;
  explanation: string;
  provider?: string;
  sources: { name: string; url: string }[];
  correctedInfo?: string;
}

export interface SearchArticle {
  name?: string;
  title?: string;
  snippet?: string;
  url?: string;
  displayUrl?: string;
  summary?: string;
  datePublished?: string;
}

export interface SearchResponse {
  webPages?: { value: SearchArticle[] };
  results?: SearchArticle[];
  value?: SearchArticle[];
  error?: string;
  message?: string;
}
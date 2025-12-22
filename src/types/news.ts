
export type VerificationStatus = 'idle' | 'searching' | 'ranking' | 'verifying' | 'verified' | 'error';
export type NewsVeracity = 'true' | 'false' | 'unverified' | 'partially-true' | 'verified' | 'misleading';
export type MediaType = 'image' | 'audio' | 'video' | 'text';

export interface MediaFile {
  file: File;
  type: MediaType;
  preview?: string;
  base64?: string;
  mimeType: string;
}

export interface NewsArticle {
  title: string;
  snippet: string;
  url: string;
  summary?: string;
  datePublished?: string;
  dateLastCrawled?: string;
}

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

export interface VerificationResult {
  id?: string;
  veracity: NewsVeracity;
  confidence: number;
  explanation: string;
  provider?: string;
  sources: {
    name: string;
    url: string;
  }[];
  correctedInfo?: string;
  sentiment?: {
    score: number; // -1 to 1
    label: 'positive' | 'negative' | 'neutral' | 'inflammatory';
    emotionalTone: string;
  };
  mediaAnalysis?: {
    type: MediaType;
    description?: string;
    transcription?: string;
    manipulationIndicators?: string[];
  };
  factCheckComparison?: {
    source: string;
    verdict: string;
    url?: string;
  }[];
}

export interface VerificationDocument {
  id: string;
  slug: string;
  userId: string;
  query: string;
  content: string;
  title: string;
  articleUrl?: string;
  articleTitle?: string;
  veracity: NewsVeracity;
  confidence: number;
  result: VerificationResult;
  timestamp: string;
  isPublic: boolean;
  viewCount: number;
  upvotes: number;
  downvotes: number;
}

export interface SearchHistoryItem {
  id?: string;
  query: string;
  title?: string;
  timestamp: string;
  articleUrl?: string;
  articleTitle?: string;
  resultType: 'search' | 'verification';
  slug?: string;
  veracity?: string;
  confidence?: number;
}

export interface NewsContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  newsContent: string;
  setNewsContent: (content: string) => void;
  status: VerificationStatus;
  setStatus: (status: VerificationStatus) => void;
  result: VerificationResult | null;
  setResult: (result: VerificationResult | null) => void;
  articles: NewsArticle[];
  setArticles: (articles: NewsArticle[]) => void;
  selectedArticle: NewsArticle | null;
  setSelectedArticle: (article: NewsArticle | null) => void;
  mediaFile: MediaFile | null;
  setMediaFile: (media: MediaFile | null) => void;
  searchNews: (query: string, slug?: string, title?: string) => Promise<NewsArticle[] | void>;
  verifyNews: () => Promise<void>;
  resetState: () => void;
  handleUnifiedInput?: (input: string, media?: MediaFile) => Promise<string | undefined>;
}

export interface AppwriteError {
  message: string;
  code?: number;
  type?: string;
  version?: string;
}

export type CleanedObject = Record<string, unknown>;

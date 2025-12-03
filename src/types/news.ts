
export type VerificationStatus = 'idle' | 'searching' | 'verifying' | 'verified' | 'error';
export type NewsVeracity = 'true' | 'false' | 'unverified' | 'partially-true';
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
}

export interface VerificationResult {
  veracity: NewsVeracity;
  confidence: number;
  explanation: string;
  sources: {
    name: string;
    url: string;
  }[];
  correctedInfo?: string;
  mediaAnalysis?: {
    type: MediaType;
    description?: string;
    transcription?: string;
    manipulationIndicators?: string[];
  };
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

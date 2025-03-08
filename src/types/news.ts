
export type VerificationStatus = 'idle' | 'searching' | 'verifying' | 'verified' | 'error';
export type NewsVeracity = 'true' | 'false' | 'unverified' | 'partially-true';

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
  searchNews: (query: string) => Promise<void>;
  verifyNews: () => Promise<void>;
  resetState: () => void;
}

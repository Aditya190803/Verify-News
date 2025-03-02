
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type VerificationStatus = 'idle' | 'verifying' | 'verified' | 'error';
export type NewsVeracity = 'true' | 'false' | 'unverified' | 'partially-true';

interface VerificationResult {
  veracity: NewsVeracity;
  confidence: number;
  explanation: string;
  sources: {
    name: string;
    url: string;
  }[];
  correctedInfo?: string;
}

interface NewsContextType {
  newsContent: string;
  setNewsContent: (content: string) => void;
  status: VerificationStatus;
  setStatus: (status: VerificationStatus) => void;
  result: VerificationResult | null;
  setResult: (result: VerificationResult | null) => void;
  verifyNews: () => Promise<void>;
  resetState: () => void;
}

const initialVerificationResult: VerificationResult = {
  veracity: 'unverified',
  confidence: 0,
  explanation: '',
  sources: [],
};

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export const NewsProvider = ({ children }: { children: ReactNode }) => {
  const [newsContent, setNewsContent] = useState<string>('');
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [result, setResult] = useState<VerificationResult | null>(null);

  // This would eventually connect to a real API
  const verifyNews = async () => {
    try {
      setStatus('verifying');

      // Simulating API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock verification logic for now
      const mockResults: VerificationResult = {
        veracity: Math.random() > 0.5 ? 'true' : 'false',
        confidence: Math.floor(Math.random() * 30) + 70,
        explanation: Math.random() > 0.5 
          ? "This news has been verified as accurate. Multiple sources confirm the key details."
          : "This claim contains false information. Official sources contradict these statements.",
        sources: [
          {
            name: "Reuters Fact Check",
            url: "https://www.reuters.com/fact-check"
          },
          {
            name: "Associated Press",
            url: "https://apnews.com"
          }
        ],
        correctedInfo: Math.random() > 0.5 
          ? "The correct information states that..." 
          : undefined
      };

      setResult(mockResults);
      setStatus('verified');
    } catch (error) {
      console.error('Error verifying news:', error);
      setStatus('error');
    }
  };

  const resetState = () => {
    setNewsContent('');
    setResult(null);
    setStatus('idle');
  };

  return (
    <NewsContext.Provider
      value={{
        newsContent,
        setNewsContent,
        status,
        setStatus,
        result,
        setResult,
        verifyNews,
        resetState,
      }}
    >
      {children}
    </NewsContext.Provider>
  );
};

export const useNews = (): NewsContextType => {
  const context = useContext(NewsContext);
  if (context === undefined) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
};

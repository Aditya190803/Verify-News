import type { VerificationResult, SearchResponse, SearchArticle, MediaFile } from '@/types/news';

/** Client AI keys removed — verify runs on Convex. Stubs for search/rank/title helpers. */

export async function rankSearchResultsWithFallback(
  results: SearchArticle[],
  _query: string,
): Promise<SearchArticle[]> {
  return results;
}

export async function verifyWithFallback(
  _content: string,
  _searchResults: SearchResponse[] = [],
): Promise<VerificationResult> {
  return {
    veracity: 'unverified',
    confidence: 0,
    explanation: 'Use the verify flow (Convex) for fact-checking.',
    sources: [],
  };
}

export async function generateTitleWithFallback(input: string): Promise<string> {
  const words = input.trim().split(/\s+/).slice(0, 6);
  return words.join(' ') || 'Verification';
}

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
  });

export const getMediaTypeFromMime = (mimeType: string): 'image' | 'audio' | 'video' | 'text' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  return 'text';
};

export async function verifyMediaWithBigPickle(_mediaFile: MediaFile): Promise<VerificationResult> {
  return verifyWithFallback('');
}
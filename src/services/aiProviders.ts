import { GoogleGenerativeAI } from '@google/generative-ai';
import { VerificationResult, SearchResponse, SearchArticle, MediaFile } from '@/types/news';
import { logger } from '@/lib/logger';
import { VerificationResultSchema } from '@/lib/schemas';
import {
  verifyWithProxy,
  verifyMediaWithProxy,
  generateTitleWithProxy,
  rankSearchResultsWithProxy,
  isAIProxyAvailable
} from './aiProxy';

// API Keys from environment variables (for backward compatibility)
const getApiKey = (name: string) => import.meta.env[name] || (typeof process !== 'undefined' ? process.env[name] : undefined);

// Model names from environment variables
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || "mistralai/devstral-2512:free";
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || "llama-3.3-70b-versatile";

// Check if we should use proxy (backend) or direct API calls
const shouldUseProxy = isAIProxyAvailable();

/**
 * Google Gemini Provider
 * Note: When proxy is enabled, this function routes through the backend
 */
export const verifyWithGemini = async (
  content: string,
  searchResults: SearchResponse[] = []
): Promise<VerificationResult> => {
  // Use proxy if available (removes need for client-side API keys)
  if (shouldUseProxy) {
    return verifyWithProxy(content, searchResults);
  }

  // Fallback to direct API call (for backward compatibility)
  const apiKey = getApiKey('VITE_GEMINI_API_KEY');
  if (!apiKey) throw new Error('Google Gemini API key is missing');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    }
  });

  const prompt = constructPrompt(content, searchResults);
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  return parseAIResponse(text);
};

/**
 * Verify media content (images, audio, video) with Gemini
 * Note: When proxy is enabled, this function routes through the backend
 */
export const verifyMediaWithGemini = async (
  mediaFile: MediaFile,
  additionalContext?: string,
  searchResults?: SearchResponse[]
): Promise<VerificationResult> => {
  // Use proxy if available (removes need for client-side API keys)
  if (shouldUseProxy) {
    return verifyMediaWithProxy(mediaFile, additionalContext, searchResults);
  }

  // Fallback to direct API call (for backward compatibility)
  const apiKey = getApiKey('VITE_GEMINI_API_KEY');
  if (!apiKey) throw new Error('Google Gemini API key is missing');

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Convert file to base64 if not already done
  const base64Data = mediaFile.base64 || await fileToBase64(mediaFile.file);
  
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    }
  });

  const searchContext = searchResults && searchResults.length > 0
    ? `Search Results:\n${JSON.stringify(searchResults, null, 2)}`
    : "No search results available.";

  const prompt = `You are a professional fact-checker. Analyze this ${mediaFile.type} for potential misinformation.
${additionalContext ? `Context: ${additionalContext}` : ''}
${searchContext}

Respond ONLY with a JSON object:
{
  "veracity": "true" | "false" | "partially-true" | "unverified",
  "confidence": number (0-100),
  "explanation": "string (2-3 sentences)",
  "sources": [{"name": "string", "url": "string"}]
}`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Data,
        mimeType: mediaFile.file.type
      }
    }
  ]);

  const response = await result.response;
  return parseAIResponse(response.text());
};

/**
 * OpenRouter Provider (Mistral Devstral)
 * Note: When proxy is enabled, this function routes through the backend
 */
export const verifyWithOpenRouter = async (
  content: string,
  searchResults: SearchResponse[] = []
): Promise<VerificationResult> => {
  // Use proxy if available (removes need for client-side API keys)
  if (shouldUseProxy) {
    return verifyWithProxy(content, searchResults);
  }

  // Fallback to direct API call (for backward compatibility)
  const apiKey = getApiKey('VITE_OPENROUTER_API_KEY');
  if (!apiKey) throw new Error('OpenRouter API key is missing');

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "model": OPENROUTER_MODEL,
      "messages": [
        { "role": "user", "content": constructPrompt(content, searchResults) }
      ],
      "response_format": { "type": "json_object" }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenRouter API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return parseAIResponse(data.choices[0].message.content);
};

/**
 * Groq Provider (Kimi)
 * Note: When proxy is enabled, this function routes through the backend
 */
export const verifyWithGroq = async (
  content: string,
  searchResults: SearchResponse[] = []
): Promise<VerificationResult> => {
  // Use proxy if available (removes need for client-side API keys)
  if (shouldUseProxy) {
    return verifyWithProxy(content, searchResults);
  }

  // Fallback to direct API call (for backward compatibility)
  const apiKey = getApiKey('VITE_GROQ_API_KEY');
  if (!apiKey) throw new Error('Groq API key is missing');

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "model": GROQ_MODEL,
      "messages": [
        { "role": "user", "content": constructPrompt(content, searchResults) }
      ],
      "response_format": { "type": "json_object" }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return parseAIResponse(data.choices[0].message.content);
};

/**
 * Fallback Mechanism
 * Order: Groq -> OpenRouter -> Gemini
 */
export const verifyWithFallback = async (
  content: string,
  searchResults: SearchResponse[] = []
): Promise<VerificationResult> => {
  const providers = [
    { name: 'Groq', fn: verifyWithGroq },
    { name: 'OpenRouter', fn: verifyWithOpenRouter },
    { name: 'Gemini', fn: verifyWithGemini }
  ];

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      logger.info(`Trying provider: ${provider.name}`);
      const result = await provider.fn(content, searchResults);
      return { ...result, provider: provider.name };
    } catch (error) {
      logger.warn(`${provider.name} failed:`, error);
      lastError = error as Error;
    }
  }

  throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
};

/**
 * Generate Title with Fallback
 */
export const generateTitleWithFallback = async (input: string): Promise<string> => {
  const providers = [
    { name: 'Groq', fn: generateTitleWithGroq },
    { name: 'OpenRouter', fn: generateTitleWithOpenRouter },
    { name: 'Gemini', fn: generateTitleWithGemini }
  ];

  for (const provider of providers) {
    try {
      logger.info(`Generating title with: ${provider.name}`);
      return await provider.fn(input);
    } catch (error) {
      logger.warn(`${provider.name} title generation failed:`, error);
    }
  }

  return ''; // Fallback to empty string if all fail
};

/**
 * Rank Search Results with Fallback
 */
export const rankSearchResultsWithFallback = async (
  content: string,
  results: SearchArticle[]
): Promise<SearchArticle[]> => {
  if (results.length <= 3) return results; // No need to rank if few results

  const providers = [
    { name: 'Groq', fn: rankWithGroq },
    { name: 'OpenRouter', fn: rankWithOpenRouter },
    { name: 'Gemini', fn: rankWithGemini }
  ];

  for (const provider of providers) {
    try {
      logger.info(`Ranking results with: ${provider.name}`);
      return await provider.fn(content, results);
    } catch (error) {
      logger.warn(`${provider.name} ranking failed:`, error);
    }
  }

  return results.slice(0, 10); // Fallback to first 10 if all fail
};

/**
 * Ranking - Gemini
 * Note: When proxy is enabled, this function routes through the backend
 */
async function rankWithGemini(content: string, results: SearchArticle[]): Promise<SearchArticle[]> {
  // Use proxy if available (removes need for client-side API keys)
  if (shouldUseProxy) {
    return rankSearchResultsWithProxy(content, results);
  }

  // Fallback to direct API call (for backward compatibility)
  const apiKey = getApiKey('VITE_GEMINI_API_KEY');
  if (!apiKey) throw new Error('Google Gemini API key is missing');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = constructRankingPrompt(content, results);
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return parseRankingResponse(response.text(), results);
}

/**
 * Ranking - OpenRouter
 * Note: When proxy is enabled, this function routes through the backend
 */
async function rankWithOpenRouter(content: string, results: SearchArticle[]): Promise<SearchArticle[]> {
  // Use proxy if available (removes need for client-side API keys)
  if (shouldUseProxy) {
    return rankSearchResultsWithProxy(content, results);
  }

  // Fallback to direct API call (for backward compatibility)
  const apiKey = getApiKey('VITE_OPENROUTER_API_KEY');
  if (!apiKey) throw new Error('OpenRouter API key is missing');

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "model": OPENROUTER_MODEL,
      "messages": [
        { "role": "user", "content": constructRankingPrompt(content, results) }
      ],
      "response_format": { "type": "json_object" }
    })
  });

  if (!response.ok) throw new Error('OpenRouter ranking failed');
  const data = await response.json();
  return parseRankingResponse(data.choices[0].message.content, results);
}

/**
 * Ranking - Groq
 * Note: When proxy is enabled, this function routes through the backend
 */
async function rankWithGroq(content: string, results: SearchArticle[]): Promise<SearchArticle[]> {
  // Use proxy if available (removes need for client-side API keys)
  if (shouldUseProxy) {
    return rankSearchResultsWithProxy(content, results);
  }

  // Fallback to direct API call (for backward compatibility)
  const apiKey = getApiKey('VITE_GROQ_API_KEY');
  if (!apiKey) throw new Error('Groq API key is missing');

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "model": GROQ_MODEL,
      "messages": [
        { "role": "user", "content": constructRankingPrompt(content, results) }
      ],
      "response_format": { "type": "json_object" }
    })
  });

  if (!response.ok) throw new Error('Groq ranking failed');
  const data = await response.json();
  return parseRankingResponse(data.choices[0].message.content, results);
}

function constructRankingPrompt(content: string, results: SearchArticle[]): string {
  const simplifiedResults = results.map((r, i) => ({
    id: i,
    title: r.title || r.name,
    snippet: r.snippet
  }));

  return `Original Content: "${content}"

Search Results:
${JSON.stringify(simplifiedResults, null, 2)}

Rank these search results by relevance to the original content. Return a JSON object with an array of IDs in order of relevance (most relevant first).
Format: { "rankedIds": [number] }`;
}

function parseRankingResponse(text: string, originalResults: SearchArticle[]): SearchArticle[] {
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const data = JSON.parse(cleaned);
    const rankedIds = data.rankedIds as number[];
    return rankedIds
      .map(id => originalResults[id])
      .filter(Boolean);
  } catch (_e) {
    logger.error("Failed to parse ranking response:", text);
    return originalResults.slice(0, 10);
  }
}

/**
 * Title Generation - Gemini
 * Note: When proxy is enabled, this function routes through the backend
 */
async function generateTitleWithGemini(input: string): Promise<string> {
  // Use proxy if available (removes need for client-side API keys)
  if (shouldUseProxy) {
    return generateTitleWithProxy(input);
  }

  // Fallback to direct API call (for backward compatibility)
  const apiKey = getApiKey('VITE_GEMINI_API_KEY');
  if (!apiKey) throw new Error('Google Gemini API key is missing');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const prompt = constructTitlePrompt(input);
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().replace(/^"|"$/g, '').trim();
}

/**
 * Title Generation - OpenRouter
 * Note: When proxy is enabled, this function routes through the backend
 */
async function generateTitleWithOpenRouter(input: string): Promise<string> {
  // Use proxy if available (removes need for client-side API keys)
  if (shouldUseProxy) {
    return generateTitleWithProxy(input);
  }

  // Fallback to direct API call (for backward compatibility)
  const apiKey = getApiKey('VITE_OPENROUTER_API_KEY');
  if (!apiKey) throw new Error('OpenRouter API key is missing');

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "model": OPENROUTER_MODEL,
      "messages": [
        { "role": "user", "content": constructTitlePrompt(input) }
      ]
    })
  });

  if (!response.ok) throw new Error('OpenRouter title generation failed');
  const data = await response.json();
  return data.choices[0].message.content.replace(/^"|"$/g, '').trim();
}

/**
 * Title Generation - Groq
 * Note: When proxy is enabled, this function routes through the backend
 */
async function generateTitleWithGroq(input: string): Promise<string> {
  // Use proxy if available (removes need for client-side API keys)
  if (shouldUseProxy) {
    return generateTitleWithProxy(input);
  }

  // Fallback to direct API call (for backward compatibility)
  const apiKey = getApiKey('VITE_GROQ_API_KEY');
  if (!apiKey) throw new Error('Groq API key is missing');

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "model": GROQ_MODEL,
      "messages": [
        { "role": "user", "content": constructTitlePrompt(input) }
      ]
    })
  });

  if (!response.ok) throw new Error('Groq title generation failed');
  const data = await response.json();
  return data.choices[0].message.content.replace(/^"|"$/g, '').trim();
}

function constructTitlePrompt(input: string): string {
  return `Generate a concise, human-readable title (max 6 words) for the following news content or topic. Respond ONLY with the title text.\n\nInput: ${input}`;
}

/**
 * Helper to construct the prompt
 */
function constructPrompt(content: string, searchResults: SearchResponse[]): string {
  const searchContext = searchResults.length > 0 
    ? `Search Results:\n${JSON.stringify(searchResults, null, 2)}`
    : "No search results available.";

  return `Verify the following news content:
"${content}"

${searchContext}

Respond ONLY with a JSON object in this format:
{
  "veracity": "true" | "false" | "partially-true" | "unverified",
  "confidence": number (0-100),
  "explanation": "string (2-3 sentences)",
  "sources": [{"name": "string", "url": "string"}]
}`;
}

/**
 * Helper to parse AI response
 */
function parseAIResponse(text: string): VerificationResult {
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    
    // Validate with Zod schema
    const result = VerificationResultSchema.safeParse(parsed);
    if (!result.success) {
      logger.error("AI response validation failed:", result.error.format());
      // Fallback to partial data if possible, or throw
      return parsed as VerificationResult;
    }
    
    return result.data as VerificationResult;
  } catch (_e) {
    logger.error("Failed to parse AI response:", text);
    throw new Error("Invalid JSON response from AI provider");
  }
}

/**
 * Helper to convert a File object to a base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
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
 * Helper to determine media type from MIME type
 */
export const getMediaTypeFromMime = (mimeType: string): 'image' | 'audio' | 'video' | 'text' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  return 'text';
};

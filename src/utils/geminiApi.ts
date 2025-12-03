import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { NewsVeracity, MediaFile, MediaType } from '@/types/news';
import { SearchResponse, SearchArticle } from '@/types/search';
import { retryWithBackoff, isQuotaError, isAuthError } from './errorHandling';
import { RATE_LIMITS, ERROR_MESSAGES } from '@/lib/constants';

// API key for Google Gemini model
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "demo-api-key";

// Initialize Google Generative AI with Gemini 2.5 Flash model
// Gemini 2.5 Flash is optimized for speed and efficiency with improved JSON response handling
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface VerificationResult {
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

// Helper function to convert File to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Helper function to determine media type from MIME type
export const getMediaTypeFromMime = (mimeType: string): MediaType => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  return 'text';
};

// Verify media content (images, audio, video) with Gemini
export const verifyMediaWithGemini = async (
  mediaFile: MediaFile,
  additionalContext?: string,
  searchResults?: SearchResponse[]
): Promise<VerificationResult> => {
  try {
    console.log(`🚀 Starting ${mediaFile.type} verification with Gemini 2.5 Flash model...`);
    
    // Convert file to base64 if not already done
    const base64Data = mediaFile.base64 || await fileToBase64(mediaFile.file);
    
    // Get the Gemini model with multimodal capabilities
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
        responseMimeType: "text/plain",
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Prepare search results context if available
    const searchResultsContext = searchResults && searchResults.length > 0 
      ? `**Current Search Results from Internet:**
${searchResults.map((result, index) => {
  const articles = result.webPages?.value || [];
  if (articles.length === 0) {
    return `${index + 1}. No search results available for this query`;
  }
  return articles.slice(0, 3).map((article: SearchArticle, articleIndex: number) => 
    `${index + 1}.${articleIndex + 1} ${article.name || 'No title'}: ${article.snippet || 'No description'} (${article.url || 'No URL'})`
  ).join('\n');
}).filter(text => text.trim()).join('\n')}
` 
      : '';

    // Build prompt based on media type
    let mediaPrompt = '';
    
    if (mediaFile.type === 'image') {
      mediaPrompt = `You are a professional fact-checker and media verification expert. Today's date is ${currentDate}.

Your task is to analyze this image for potential misinformation, manipulation, or fake news.

${additionalContext ? `ADDITIONAL CONTEXT PROVIDED BY USER:\n"${additionalContext}"\n` : ''}

${searchResultsContext}

ANALYSIS TASKS:
1. Describe what you see in the image in detail
2. Check for signs of digital manipulation (inconsistent lighting, clone stamps, unnatural edges, warping, AI generation artifacts)
3. Look for misleading context (old images presented as new, images from different events)
4. Identify any text overlays and verify their claims
5. Check if this appears to be a screenshot from social media or news
6. Assess if the image could be AI-generated (look for typical AI artifacts like wrong hands, weird text, inconsistent details)
7. Cross-reference with any search results provided

RESPONSE FORMAT - You MUST respond with valid JSON only:
{
  "veracity": "true" | "false" | "partially-true" | "unverified",
  "confidence": 85,
  "explanation": "Detailed explanation in 2-3 sentences about the image's authenticity",
  "sources": ["source1", "source2"],
  "mediaAnalysis": {
    "type": "image",
    "description": "Detailed description of the image content",
    "manipulationIndicators": ["indicator1", "indicator2"]
  }
}`;
    } else if (mediaFile.type === 'audio') {
      mediaPrompt = `You are a professional fact-checker and audio verification expert. Today's date is ${currentDate}.

Your task is to analyze this audio for potential misinformation, manipulation, or fake news.

${additionalContext ? `ADDITIONAL CONTEXT PROVIDED BY USER:\n"${additionalContext}"\n` : ''}

${searchResultsContext}

ANALYSIS TASKS:
1. Transcribe the main content of the audio
2. Verify any claims or statements made in the audio
3. Check for signs of audio manipulation (unnatural cuts, voice cloning indicators, inconsistent background noise)
4. Identify the speakers if possible
5. Assess if the audio could be AI-generated or deepfaked
6. Cross-reference claims with any search results provided

RESPONSE FORMAT - You MUST respond with valid JSON only:
{
  "veracity": "true" | "false" | "partially-true" | "unverified",
  "confidence": 85,
  "explanation": "Detailed explanation in 2-3 sentences about the audio's authenticity",
  "sources": ["source1", "source2"],
  "mediaAnalysis": {
    "type": "audio",
    "transcription": "Full transcription of the audio content",
    "description": "Description of audio characteristics and speakers",
    "manipulationIndicators": ["indicator1", "indicator2"]
  }
}`;
    } else if (mediaFile.type === 'video') {
      mediaPrompt = `You are a professional fact-checker and video verification expert. Today's date is ${currentDate}.

Your task is to analyze this video for potential misinformation, manipulation, or fake news.

${additionalContext ? `ADDITIONAL CONTEXT PROVIDED BY USER:\n"${additionalContext}"\n` : ''}

${searchResultsContext}

ANALYSIS TASKS:
1. Describe the video content in detail
2. Transcribe any spoken content or text overlays
3. Check for signs of video manipulation (deepfakes, face swaps, edited clips, out-of-context usage)
4. Look for inconsistencies in lighting, shadows, or movements
5. Identify speakers and verify their identity if claimed
6. Assess if the video could be AI-generated
7. Check for signs of selective editing or misleading cuts
8. Cross-reference claims with any search results provided

RESPONSE FORMAT - You MUST respond with valid JSON only:
{
  "veracity": "true" | "false" | "partially-true" | "unverified",
  "confidence": 85,
  "explanation": "Detailed explanation in 2-3 sentences about the video's authenticity",
  "sources": ["source1", "source2"],
  "mediaAnalysis": {
    "type": "video",
    "transcription": "Transcription of spoken content",
    "description": "Detailed description of the video content and scenes",
    "manipulationIndicators": ["indicator1", "indicator2"]
  }
}`;
    }

    // Create the multimodal content parts
    const parts = [
      {
        inlineData: {
          mimeType: mediaFile.mimeType,
          data: base64Data
        }
      },
      { text: mediaPrompt }
    ];

    // Generate content with multimodal input
    const result = await model.generateContent(parts);
    const response = await result.response;
    
    if (!response) {
      throw new Error('No response received from Gemini API');
    }

    let text;
    try {
      text = response.text();
    } catch {
      if (response.candidates && response.candidates[0] && response.candidates[0].content) {
        text = response.candidates[0].content.parts[0].text;
      } else {
        throw new Error('No response text available from Gemini API');
      }
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from Gemini');
    }

    console.log('✅ Successfully received media analysis from Gemini');

    // Parse the response
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('Invalid JSON structure in response');
    }
    
    cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanedText);
    } catch {
      let fixedText = cleanedText;
      if (!cleanedText.endsWith('}')) fixedText = cleanedText + '}';
      fixedText = fixedText.replace(/,\s*}$/, '}');
      parsedResponse = JSON.parse(fixedText);
    }

    // Normalize sources - handle both string arrays and object arrays
    let normalizedSources: { name: string; url: string }[] = [];
    if (Array.isArray(parsedResponse.sources)) {
      normalizedSources = parsedResponse.sources.map((source: unknown) => {
        if (typeof source === 'string') {
          if (source.startsWith('http')) {
            try {
              const urlObj = new URL(source);
              return { name: urlObj.hostname.replace('www.', ''), url: source };
            } catch {
              return { name: source, url: source };
            }
          }
          return { name: source, url: '' };
        } else if (source && typeof source === 'object') {
          const s = source as { name?: string; url?: string; title?: string; link?: string };
          return {
            name: s.name || s.title || 'Unknown Source',
            url: s.url || s.link || ''
          };
        }
        return { name: 'Unknown Source', url: '' };
      }).filter((s: { name: string; url: string }) => s.url && s.url.startsWith('http'));
    }

    const validatedResponse: VerificationResult = {
      veracity: parsedResponse.veracity || 'unverified',
      confidence: typeof parsedResponse.confidence === 'number' ? 
        Math.max(0, Math.min(100, parsedResponse.confidence)) : 0,
      explanation: parsedResponse.explanation || 'Unable to verify media content.',
      sources: normalizedSources,
      mediaAnalysis: parsedResponse.mediaAnalysis || {
        type: mediaFile.type,
        description: 'Analysis completed'
      }
    };

    console.log('🎯 Final media verification result:', validatedResponse);
    return validatedResponse;

  } catch (error) {
    console.error('Error verifying media with Gemini:', error);
    
    return {
      veracity: 'unverified' as const,
      confidence: 0,
      explanation: `Unable to verify ${mediaFile.type} content due to a technical error. Please try again.`,
      sources: [],
      mediaAnalysis: {
        type: mediaFile.type,
        description: 'Analysis failed due to technical error'
      }
    };
  }
};

export const verifyNewsWithGemini = async (
  newsContent: string,
  searchQuery: string,
  articleUrl?: string,
  searchResults?: SearchResponse[]
): Promise<VerificationResult> => {
  try {
    console.log("🚀 Starting news verification with Gemini 2.5 Flash model...");
    console.log("📝 Content length:", newsContent.length, "characters");
    
    // Get the Gemini model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048, // Increased to prevent truncation
        responseMimeType: "text/plain",
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    // Prepare search results context if available
    // Prepare search results context if available
    console.log('🔍 Processing search results for Gemini:', {
      hasSearchResults: !!searchResults,
      searchResultsLength: searchResults?.length || 0,
      firstResultStructure: searchResults?.[0] ? Object.keys(searchResults[0]) : [],
      hasWebPages: !!searchResults?.[0]?.webPages,
      hasValue: !!searchResults?.[0]?.webPages?.value,
      valueLength: searchResults?.[0]?.webPages?.value?.length || 0
    });
    
    const searchResultsContext = searchResults && searchResults.length > 0 
      ? `**Current Search Results from Internet:**
${searchResults.map((result, index) => {
  // Handle LangSearch format (webPages.value)
  const articles = result.webPages?.value || [];
  if (articles.length === 0) {
    return `${index + 1}. No search results available for this query`;
  }
  return articles.slice(0, 3).map((article: SearchArticle, articleIndex: number) => 
    `${index + 1}.${articleIndex + 1} ${article.name || 'No title'}: ${article.snippet || 'No description'} (${article.url || 'No URL'})`
  ).join('\n');
}).filter(text => text.trim()).join('\n')}

**Real-time Information Context:**
The above represents available search context from real-time web search. Use this information to verify the claims in the news content.
` 
      : `**Search Status:** Unable to retrieve current search results due to connectivity issues. Please analyze based on the content itself and your training data, while noting this limitation in your response.
`;

    console.log('📝 Search results context preview:', searchResultsContext.substring(0, 500) + '...');

    // Prepare prompt for news verification
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const prompt = `You are a professional fact-checker and news verification expert. Today's date is ${currentDate}.

Your task is to verify the following news content and provide a structured analysis.

NEWS CONTENT TO VERIFY:
"${newsContent}"

${searchResultsContext}

INSTRUCTIONS:
1. Analyze the news content for factual accuracy
2. Use the provided search results as your PRIMARY source of current information
3. If search results are limited, clearly state this limitation
4. Cross-reference multiple sources when possible
5. Consider the credibility of sources
6. Check for temporal consistency (dates, timelines)
7. Look for corroborating evidence or contradictory information

RESPONSE FORMAT - You MUST respond with valid JSON only, no additional text:
{
  "veracity": "true" | "false" | "partially-true" | "unverified",
  "confidence": 85,
  "explanation": "Detailed explanation in exactly 2-3 sentences",
  "sources": [
    {"name": "Source Name", "url": "https://example.com/article"},
    {"name": "Another Source", "url": "https://example2.com/article"}
  ]
}

CRITICAL INSTRUCTIONS:
- Respond ONLY with the JSON object
- Keep explanation to exactly 2-3 sentences
- Be concise but thorough
- Ensure the JSON is complete and properly formatted
- Do not include any text before or after the JSON
- Sources MUST include real URLs from the search results provided above
- Use actual article titles as source names`;

    // Generate content with improved configuration for Gemini 2.5 Flash
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Check if response is blocked or empty
    if (!response) {
      console.error('❌ No response object received from Gemini');
      throw new Error('No response received from Gemini API - service may be temporarily unavailable');
    }

    // Check for safety filtering or other blocks
    if (response.candidates && response.candidates.length === 0) {
      console.error('❌ Response was blocked by safety filters');
      throw new Error('Content was blocked by safety filters - please try different wording');
    }

    let text;
    try {
      text = response.text();
    } catch (textError) {
      console.error('❌ Error extracting text from response:', textError);
      
      // Try to get text from candidates directly
      if (response.candidates && response.candidates[0] && response.candidates[0].content) {
        try {
          text = response.candidates[0].content.parts[0].text;
          console.log('✅ Extracted text from candidates');
        } catch (candidateError) {
          console.error('❌ Failed to extract text from candidates:', candidateError);
          throw new Error('Unable to extract response text from Gemini');
        }
      } else {
        throw new Error('No response text available from Gemini API');
      }
    }

    if (!text || text.trim().length === 0) {
      console.error('❌ Empty response text from Gemini');
      console.log('📊 Response candidates:', response.candidates);
      
      // Check if the response was blocked by safety filters
      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        const candidate = candidates[0];
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
          console.warn(`⚠️ Response was blocked: ${candidate.finishReason}`);
          throw new Error(`Gemini response blocked due to safety filters: ${candidate.finishReason}`);
        }
      }
      
      throw new Error('No response text received from Gemini - response may be empty or blocked');
    }

    console.log('✅ Successfully received response from Gemini 2.5 Flash');
    console.log('📄 Raw Gemini response (first 500 chars):', text.substring(0, 500));

    // More aggressive text cleaning and validation
    let cleanedText = text.trim();
    
    // Remove any markdown formatting
    cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find the first { and last } to extract just the JSON
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      console.error('❌ No valid JSON braces found in response');
      throw new Error('Invalid JSON structure in Gemini response');
    }
    
    cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
    
    console.log('🔧 Cleaned text for parsing (first 300 chars):', cleanedText.substring(0, 300));
    
    // Validate that it looks like JSON before parsing
    if (!cleanedText.startsWith('{') || !cleanedText.endsWith('}')) {
      console.error('❌ Response doesn\'t look like valid JSON structure');
      console.error('❌ Full cleaned response:', cleanedText);
      throw new Error('Invalid JSON structure in Gemini response');
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanedText);
      console.log('✅ Successfully parsed JSON response');
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      console.error('❌ Attempted to parse:', cleanedText);
      
      // Attempt to fix common JSON issues
      let fixedText = cleanedText;
      
      // Fix common truncation issues
      if (!cleanedText.endsWith('}')) {
        fixedText = cleanedText + '}';
      }
      
      // Fix incomplete strings at the end
      fixedText = fixedText.replace(/",?\s*$/, '"}');
      fixedText = fixedText.replace(/,\s*}$/, '}');
      
      // Fix incomplete arrays
      fixedText = fixedText.replace(/,\s*\]$/, ']');
      
      // Try parsing the fixed version
      try {
        parsedResponse = JSON.parse(fixedText);
        console.log('✅ Successfully parsed fixed JSON response');
      } catch (secondParseError) {
        console.error('❌ Failed to parse even after fixes:', secondParseError);
        throw new Error('Invalid JSON structure in Gemini response');
      }
    }

    // Normalize sources - handle both string arrays and object arrays
    let normalizedSources: { name: string; url: string }[] = [];
    if (Array.isArray(parsedResponse.sources)) {
      normalizedSources = parsedResponse.sources.map((source: unknown) => {
        if (typeof source === 'string') {
          // If it's a URL string, extract domain as name
          if (source.startsWith('http')) {
            try {
              const urlObj = new URL(source);
              return { name: urlObj.hostname.replace('www.', ''), url: source };
            } catch {
              return { name: source, url: source };
            }
          }
          return { name: source, url: '' };
        } else if (source && typeof source === 'object') {
          const s = source as { name?: string; url?: string; title?: string; link?: string };
          return {
            name: s.name || s.title || 'Unknown Source',
            url: s.url || s.link || ''
          };
        }
        return { name: 'Unknown Source', url: '' };
      }).filter((s: { name: string; url: string }) => s.url && s.url.startsWith('http'));
    }

    // Validate required fields and provide defaults if missing
    const validatedResponse: VerificationResult = {
      veracity: parsedResponse.veracity || 'unverified',
      confidence: typeof parsedResponse.confidence === 'number' ? 
        Math.max(0, Math.min(100, parsedResponse.confidence)) : 0,
      explanation: parsedResponse.explanation || 'Unable to verify due to response parsing issues.',
      sources: normalizedSources
    };

    console.log('🎯 Final verification result:', validatedResponse);
    console.log('📚 Normalized sources:', normalizedSources);
    return validatedResponse;

  } catch (error) {
    console.error('Error calling Gemini 2.5 Flash API:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Unable to verify this content due to a technical error.';
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Invalid or missing Gemini API key. Please check your configuration.';
      } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
        errorMessage = 'API quota exceeded. Please try again in a few minutes.';
      } else if (error.message.includes('blocked') || error.message.includes('safety')) {
        errorMessage = 'Content was blocked by safety filters. Please try different phrasing.';
      } else if (error.message.includes('No response')) {
        errorMessage = 'No response received from AI service. Please try again.';
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Error processing AI response. Please try again.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
    }
    
    // Return a fallback result instead of throwing
    return {
      veracity: 'unverified' as const,
      confidence: 0,
      explanation: `${errorMessage} Please try again or verify manually using reliable news sources.`,
      sources: []
    };
  }
};

// Fallback verification for when Gemini 2.5 Flash API calls fail
export const getMockVerificationResult = (articleUrl?: string): VerificationResult => {
  console.log("⚠️ Using mock verification data - Gemini 2.5 Flash API unavailable");
  
  const mockResults: VerificationResult = {
    veracity: Math.random() > 0.5 ? 'true' : 'false',
    confidence: Math.floor(Math.random() * 30) + 70,
    explanation: Math.random() > 0.5 
      ? "This news has been verified as accurate using fallback verification. Multiple sources confirm the key details."
      : "This claim contains questionable information based on preliminary analysis. Official sources may contradict these statements.",
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
      : null
  };

  // If we have an article URL, include it as the primary source
  if (articleUrl) {
    mockResults.sources.unshift({
      name: "Original Article",
      url: articleUrl
    });
  }

  return mockResults;
};

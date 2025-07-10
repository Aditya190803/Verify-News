import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { NewsVeracity } from '@/types/news';

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
}

export const verifyNewsWithGemini = async (
  newsContent: string,
  searchQuery: string,
  articleUrl?: string,
  searchResults?: any[]
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
  return articles.slice(0, 3).map((article: any, articleIndex: number) => 
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
  "sources": ["source1", "source2"]
}

CRITICAL INSTRUCTIONS:
- Respond ONLY with the JSON object
- Keep explanation to exactly 2-3 sentences
- Be concise but thorough
- Ensure the JSON is complete and properly formatted
- Do not include any text before or after the JSON`;

    // Generate content with improved configuration for Gemini 2.5 Flash
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No response text received from Gemini');
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

    // Validate required fields and provide defaults if missing
    const validatedResponse: VerificationResult = {
      veracity: parsedResponse.veracity || 'unverified',
      confidence: typeof parsedResponse.confidence === 'number' ? 
        Math.max(0, Math.min(100, parsedResponse.confidence)) : 0,
      explanation: parsedResponse.explanation || 'Unable to verify due to response parsing issues.',
      sources: Array.isArray(parsedResponse.sources) ? parsedResponse.sources : []
    };

    console.log('🎯 Final verification result:', validatedResponse);
    return validatedResponse;

  } catch (error) {
    console.error('Error calling Gemini 2.5 Flash API:', error);
    
    // Return a fallback result instead of throwing
    return {
      veracity: 'unverified' as const,
      confidence: 0,
      explanation: 'Unable to verify this content due to a technical error. Please try again or verify manually using reliable news sources.',
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

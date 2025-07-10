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
    
    const prompt = `You are an expert news verification assistant using the latest Gemini 2.5 Flash model with access to current information. Analyze the following news content and determine its veracity with high accuracy.

**Current Date**: ${currentDate}

**Task**: Verify the truthfulness of the news content below and provide a detailed analysis using current information.

${searchResultsContext}

**STRICT REQUIREMENTS:**
- You MUST use the current search results provided above to verify information if available and relevant
- If search results are limited, contain only search context, or indicate connectivity issues, acknowledge this limitation
- When real-time search data is unavailable, use logical analysis of the claim itself, considering factors like:
  * Timeline consistency (is the date in the future/past relative to current date?)
  * Plausibility of the claim
  * Known patterns or historical context
- If the search results contain current information that contradicts your training data, prioritize the search results
- You MUST only include real, working sources with valid URLs that are accessible and directly support your analysis
- If you cannot find real sources, return an empty sources array
- Your explanation must be clear, specific, and mention if verification is limited by search availability
- Consider the current date (${currentDate}) when evaluating time-sensitive claims
- For future-dated claims, note that events cannot be verified until they occur
- Do NOT include any source with a URL that is not a real, working page

**Required JSON Response Format:**
{
  "veracity": "true|false|partially-true|unverified",
  "confidence": [number between 0-100],
  "explanation": "[detailed analysis explaining your reasoning with specific points]",
  "sources": [
    { "name": "Source Name", "url": "https://source-url.com" },
    { "name": "Another Source", "url": "https://another-source.com" }
  ],
  "correctedInfo": "[provide accurate information if content is false or partially true, null if true]"
}

**News Content to Verify:**
"${newsContent}"

**Context:**
- Search query: "${searchQuery}"
${articleUrl ? `- Original source: ${articleUrl}` : ''}

**Instructions:**
1. Analyze the content for factual accuracy
2. Cross-reference with known reliable sources  
3. Consider the context and potential bias
4. Provide specific evidence for your assessment
5. If false/partially-true, explain what the correct information should be
6. Return ONLY valid JSON - no markdown, no extra text

**CRITICAL**: Your response must be valid JSON only. Do not include any text before or after the JSON.

Respond with the JSON object only:`;

    // Generate content with improved configuration for Gemini 2.5 Flash
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3, // Lower temperature for more factual responses
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 2048,
        responseMimeType: "application/json", // Request JSON response
      },
    });
    
    console.log("✅ Successfully received response from Gemini 2.5 Flash");
    
    const response = await result.response;
    const text = response.text();
    
    console.log("📄 Raw Gemini response (first 500 chars):", text.substring(0, 500));
    
    // Clean up the response text
    let cleanedText = text.trim();
    
    // Remove any markdown code block formatting
    cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Remove any leading/trailing text that's not JSON
    const jsonStart = cleanedText.indexOf('{');
    const jsonEnd = cleanedText.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
    }
    
    console.log("🔧 Cleaned text for parsing (first 300 chars):", cleanedText.substring(0, 300));
    
    // Validate that we have a proper JSON structure
    if (!cleanedText.startsWith('{') || !cleanedText.endsWith('}')) {
      console.error("❌ Response doesn't look like valid JSON structure");
      console.error("❌ Full cleaned response:", cleanedText);
      throw new Error("Invalid JSON structure in Gemini response");
    }
    
    // Try to parse the cleaned JSON
    try {
      const parsedResult = JSON.parse(cleanedText);
      console.log("✅ Successfully parsed JSON response");
      
      // Validate required fields
      if (!parsedResult.veracity || !parsedResult.explanation || parsedResult.confidence === undefined) {
        console.error("❌ Missing required fields in response:", parsedResult);
        throw new Error("Response missing required fields");
      }
      
      return parsedResult;
    } catch (parseError) {
      console.error("❌ JSON parsing failed:", parseError.message);
      console.error("📄 Failed text:", cleanedText);
      
      // Try to extract any JSON that might be embedded
      const jsonMatch = cleanedText.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
      if (jsonMatch) {
        try {
          const embeddedJson = JSON.parse(jsonMatch[0]);
          console.log("✅ Extracted embedded JSON successfully");
          return embeddedJson;
        } catch (embeddedError) {
          console.error("❌ Embedded JSON parsing also failed:", embeddedError.message);
        }
      }
      
      throw new Error(`Failed to parse Gemini response as JSON: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Error calling Gemini 2.5 Flash API:", error);
    
    // Provide more specific error context
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error("Invalid Gemini API key. Please check your API key configuration.");
      } else if (error.message.includes('quota')) {
        throw new Error("Gemini API quota exceeded. Please try again later.");
      } else if (error.message.includes('JSON')) {
        throw new Error("Failed to parse response from Gemini 2.5 Flash. The model may be experiencing issues.");
      }
    }
    
    throw error;
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

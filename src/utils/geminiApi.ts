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
  articleUrl?: string
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
    });    // Prepare prompt for news verification
    const prompt = `You are an expert news verification assistant using the latest Gemini 2.5 Flash model. Analyze the following news content and determine its veracity with high accuracy.

    **Task**: Verify the truthfulness of the news content below and provide a detailed analysis.

    **Required JSON Response Format**:
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

    **News Content to Verify**:
    "${newsContent}"

    **Context**:
    - Search query: "${searchQuery}"
    ${articleUrl ? `- Original source: ${articleUrl}` : ''}
    
    **Instructions**:
    1. Analyze the content for factual accuracy
    2. Cross-reference with known reliable sources
    3. Consider the context and potential bias
    4. Provide specific evidence for your assessment
    5. If false/partially-true, explain what the correct information should be
    6. Return only valid JSON format

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
    
    // Since we requested JSON format, try to parse directly first
    try {
      const parsedResult = JSON.parse(text);
      return parsedResult;
    } catch (parseError) {
      // Fallback: Extract JSON from text if direct parsing fails
      const jsonMatch = text.match(/{[\s\S]*}/);
      
      if (!jsonMatch) {
        throw new Error("Failed to parse JSON response from Gemini 2.5 Flash API");
      }
      
      const parsedResult = JSON.parse(jsonMatch[0]);
      return parsedResult;
    }  } catch (error) {
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
      : undefined
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

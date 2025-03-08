
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { NewsVeracity } from '@/types/news';

// API key for Google Gemini model
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"; // Replace with your Gemini API key

// Initialize Google Generative AI
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
    // Get the Gemini model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
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

    // Prepare prompt for news verification
    const prompt = `You are a news verification assistant. Analyze the following news content and determine if it's true, false, or partially true. If false or partially true, provide corrections.
                
    Please respond in this JSON format:
    {
      "veracity": "true|false|partially-true",
      "confidence": [number between 0-100],
      "explanation": [your analysis explaining why the content is true, false, or partially true],
      "sources": [
        { "name": "Source Name", "url": "https://source-url.com" },
        ...
      ],
      "correctedInfo": [provide the correct information if the content is false or partially true]
    }
    
    News content to verify:
    ${newsContent}
    
    Additional context:
    This news was found in a search for "${searchQuery}".
    ${articleUrl ? `Original source: ${articleUrl}` : ''}`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract the JSON part from the text response
    const jsonMatch = text.match(/{[\s\S]*}/);
    
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON response from Gemini API");
    }
    
    const parsedResult = JSON.parse(jsonMatch[0]);
    
    return parsedResult;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};

// Fallback verification for when API calls fail
export const getMockVerificationResult = (articleUrl?: string): VerificationResult => {
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

  // If we have an article URL, include it as the primary source
  if (articleUrl) {
    mockResults.sources.unshift({
      name: "Original Article",
      url: articleUrl
    });
  }

  return mockResults;
};

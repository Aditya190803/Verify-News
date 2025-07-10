import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "demo-api-key";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const getLLMGeneratedTitle = async (input: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      ],
    });
    const prompt = `Generate a concise, human-readable title for the following news content, topic, or link. The title should be suitable for use as a label in a user's search/verification history.\n\nInput:\n${input}\n\nTitle:`;
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 48,
        responseMimeType: "text/plain",
      },
    });
    const response = await result.response;
    const text = response.text().trim();
    // Remove any leading/trailing quotes or whitespace
    return text.replace(/^"|"$/g, '').trim();
  } catch (error) {
    console.error('Error generating LLM title:', error);
    return '';
  }
};

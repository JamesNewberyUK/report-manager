import { 
  GoogleGenerativeAI
} from '@google/generative-ai';

// Initialize the Google Generative AI client
const initializeGemini = (apiKey: string) => {
  if (!apiKey) {
    throw new Error('Google Gemini API key is required');
  }
  return new GoogleGenerativeAI(apiKey);
};

export interface GeminiResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export const generateContent = async (
  apiKey: string,
  prompt: string,
  model: string = 'gemini-3.1-pro-preview'
): Promise<GeminiResponse> => {
  try {
    const genAI = initializeGemini(apiKey);
    // Configure the model with built-in search capability
    const modelInstance = genAI.getGenerativeModel({
      model,
      // Enable the built-in Google Search tool
      tools: [{
        googleSearch: {}
      }]
    });

    // Generate content with the prompt
    const result = await modelInstance.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    });
    
    const response = await result.response;
    const text = response.text();
    
    // Get usage metrics if available
    const usage = result.response.usageMetadata ? {
      promptTokens: result.response.usageMetadata.promptTokenCount || 0,
      completionTokens: result.response.usageMetadata.candidatesTokenCount || 0,
      totalTokens: result.response.usageMetadata.totalTokenCount || 0,
    } : undefined;

    return { text, usage };
  } catch (error) {
    console.error('Error generating content with Gemini:', error);
    throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default {
  generateContent,
};

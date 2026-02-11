import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Property, User } from "./types";

/**
 * Helper to ensure a new instance is created with the current process.env.API_KEY.
 * Always returns a fresh client to pick up changes from the AI Studio key dialog.
 */
const getAiClient = () => {
  const key = process.env.API_KEY;
  // Check if key is missing or a placeholder
  if (!key || key === 'undefined' || key === 'YOUR_API_KEY' || key.length < 5) {
    throw new Error("API_KEY_REQUIRED");
  }
  return new GoogleGenAI({ apiKey: key });
};

/**
 * Smart matching for tenants and properties
 */
export const getPropertyMatches = async (user: User, properties: Property[]): Promise<any> => {
  try {
    const ai = getAiClient();
    const prompt = `
      Act as "RentAI Matcher", a socially-conscious rental expert in Bangladesh.
      Analyze these properties for this user based on their profile and lifestyle tags.

      Tenant Profile:
      - Role: ${user.role}
      - Is Bachelor: ${user.isBachelor ? 'Yes' : 'No'}
      - Budget: ${user.budget} BDT
      - Lifestyle Preferences: ${user.preferences.join(', ')}

      Properties:
      ${properties.map(p => `- ID: ${p.id}, Title: ${p.title}, Price: ${p.price}, Area: ${p.area}, Bachelor Friendly: ${p.bachelorFriendly}`).join('\n')}

      RESPONSE FORMAT (JSON Array):
      - id: string
      - score: number (0-100)
      - reason: string (brief explanation of why it matches or doesn't)
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              score: { type: Type.NUMBER },
              reason: { type: Type.STRING }
            },
            required: ["id", "score", "reason"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    console.error("AI Matching Error:", error);
    // Specifically catch auth-related errors to trigger the key selection UI
    if (error.message?.includes("API_KEY_REQUIRED") || error.message?.includes("API key") || error.message?.includes("entity was not found") || error.status === 403 || error.status === 401) {
      throw new Error("API_KEY_REQUIRED");
    }
    return [];
  }
};

/**
 * FEATURE: Video Understanding
 * Note: Uses Pro model, requires paid API key via aistudio.openSelectKey()
 */
export const analyzePropertyVideo = async (videoBase64: string, mimeType: string) => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        {
          inlineData: {
            data: videoBase64,
            mimeType: mimeType,
          },
        },
        {
          text: "Analyze this property walkthrough video. Extract: 1. Bedrooms. 2. Bathrooms. 3. Features. 4. Suggested title. Return as JSON.",
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bedrooms: { type: Type.NUMBER },
            bathrooms: { type: Type.NUMBER },
            features: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedTitle: { type: Type.STRING }
          },
          required: ["bedrooms", "bathrooms", "features", "suggestedTitle"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.error("Video Analysis Error:", error);
    if (error.message?.includes("API_KEY_REQUIRED") || error.message?.includes("API key") || error.message?.includes("entity was not found")) {
      throw new Error("API_KEY_REQUIRED");
    }
    return null;
  }
};

/**
 * FEATURE: Advanced Chat with different Gemini models
 */
export const getAdvancedChatResponse = async (
  message: string, 
  mode: 'fast' | 'thinking' | 'search' = 'fast'
) => {
  try {
    const ai = getAiClient();
    if (mode === 'search') {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: message,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      return {
        text: response.text,
        grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks
      };
    } else if (mode === 'thinking') {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: message,
        config: {
          thinkingConfig: { thinkingBudget: 32768 }
        },
      });
      return { text: response.text };
    } else {
      const response = await ai.models.generateContent({
        // Updated model name to match guidelines
        model: 'gemini-flash-lite-latest',
        contents: message,
      });
      return { text: response.text };
    }
  } catch (error: any) {
    console.error("Advanced Chat Error:", error);
    if (error.message?.includes("API_KEY_REQUIRED") || error.message?.includes("API key") || error.message?.includes("entity was not found")) {
      return { text: "API_KEY_REQUIRED" };
    }
    return { text: "Connection error. Please verify your Gemini API key in the connection settings." };
  }
};
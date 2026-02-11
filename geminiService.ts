
import { GoogleGenAI, Type } from "@google/genai";
import { Property, User } from "./types";

// Removed redundant check for process.env.API_KEY to follow "assume pre-configured" guideline
export const getPropertyMatches = async (user: User, properties: Property[]): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Act as "RentAI Matcher", a socially-conscious rental expert in Bangladesh.
    Your goal is to match tenants to properties while specifically overcoming "Bachelor Discrimination" and finding the best lifestyle fit by analyzing property location context.

    Tenant Profile:
    - Role: ${user.role}
    - Is Bachelor: ${user.isBachelor ? 'Yes' : 'No'}
    - Budget: ${user.budget} BDT
    - Lifestyle Preferences: ${user.preferences.join(', ')}

    Properties to analyze:
    ${properties.map(p => `
      - ID: ${p.id}
        Title: ${p.title}
        Price: ${p.price}
        Area: ${p.area}
        Location Context: ${p.location}
        Bachelor Friendly: ${p.bachelorFriendly ? 'YES' : 'NO'}
        Verified: ${p.verified ? 'YES' : 'NO'}
        Key Features: ${p.features.join(', ')}
        Nearby Amenities: ${p.nearbyAmenities.join(', ')}
    `).join('\n')}

    SCORING RULES:
    1. If user is a Bachelor and property is NOT Bachelor Friendly, the score MUST be below 40.
    2. If property is Bachelor Friendly and user is a Bachelor, give a significant boost.
    3. Match budget strictly; +/- 10% is acceptable, but outside that, lower the score.
    4. Match "Lifestyle Preferences" to "Key Features" AND "Nearby Amenities".
       - Example: If user prefers "Fast WiFi" and property has it, boost score.
       - Example: If user prefers "Near University" and property is near a known University (check Nearby Amenities), boost score.
       - Example: If user prefers "Modern Design" and property is "Renovated", boost score.
    5. LOCATION CONTEXT: Analyze "Nearby Amenities" to provide a highly localized reason. If it's near a Metro Station, mention the commute advantage. If it's near a Park or Hospital, highlight that based on user preferences.

    RESPONSE FORMAT (JSON Array):
    - id: string
    - score: number (0-100)
    - reason: string (A concise, empathetic sentence explaining the match. Mention specific nearby amenities if they align with the user's lifestyle preferences to show deep contextual understanding of the Dhaka market).
  `;

  try {
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

    // Directly access .text property as per extracting text guidelines
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Matching Error:", error);
    return [];
  }
};

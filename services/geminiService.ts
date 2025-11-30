import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Cigar, RecommendedCigar } from "../types";

const apiKey = process.env.API_KEY || '';

const FLAVOR_LIST = [
  'Cedar', 'Earth', 'Leather', 'Pepper', 'Spice', 
  'Coffee', 'Cocoa', 'Cream', 'Nutty', 'Sweet', 
  'Hay', 'Grass', 'Vanilla', 'Fruit', 'Citrus', 
  'Floral', 'Oak', 'Toast', 'Caramel', 'Cinnamon'
];

export const analyzeCigarImage = async (base64Image: string): Promise<Partial<Cigar>> => {
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });
  
  // Clean base64 string if it contains data URI prefix
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: `Analyze this cigar image carefully. Return a JSON object with the following details:
            - Brand and Name (be specific)
            - Vitola (shape), Wrapper type, Country of Origin
            - Estimated Strength (Mild, Medium, Full)
            - Technical specs: Estimated Ring Gauge and Length (in inches)
            - 5 dominant flavor notes. IMPORTANT: Choose primarily from this list if applicable: ${FLAVOR_LIST.join(', ')}. You can add unique ones if highly prominent.
            - A brief visual description`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brand: { type: Type.STRING },
            name: { type: Type.STRING },
            vitola: { type: Type.STRING },
            wrapper: { type: Type.STRING },
            origin: { type: Type.STRING },
            strength: { type: Type.STRING, enum: ["Mild", "Medium", "Full"] },
            ringGauge: { type: Type.NUMBER },
            length: { type: Type.NUMBER },
            flavorProfile: { type: Type.ARRAY, items: { type: Type.STRING } },
            notes: { type: Type.STRING, description: "Brief visual description" }
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      
      // Normalize flavors to match UI constants (case-insensitive check)
      if (data.flavorProfile && Array.isArray(data.flavorProfile)) {
        data.flavorProfile = data.flavorProfile.map((f: string) => {
          const match = FLAVOR_LIST.find(lf => lf.toLowerCase() === f.toLowerCase());
          // Return the matched standard flavor or title-case the custom one
          return match || (f.charAt(0).toUpperCase() + f.slice(1));
        });
      }
      
      return data;
    }
    return {};
  } catch (error) {
    console.error("Analysis failed", error);
    throw error;
  }
};

export const getCigarRecommendations = async (favorites: Cigar[]): Promise<RecommendedCigar[]> => {
  if (!apiKey) throw new Error("API Key missing");
  if (favorites.length === 0) return [];

  const ai = new GoogleGenAI({ apiKey });
  
  // Includes flavor profile tags in the prompt history
  const historyText = favorites.map(c => 
    `- ${c.brand} ${c.name} (${c.origin}, ${c.strength}) | Flavors: ${c.flavorProfile.join(', ')}`
  ).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an expert Cigar Sommelier. Based strictly on the flavor profiles (tags) and characteristics of the user's FAVORITE cigars listed below, recommend 3 new specific cigars they should try.
      
      User's Favorites:
      ${historyText}
      
      Analyze the dominant flavor tags (e.g. Earth, Pepper, Cream) in the list above to find cigars with similar profiles.
      Provide the response in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              brand: { type: Type.STRING },
              name: { type: Type.STRING },
              reason: { type: Type.STRING, description: "Explain why this fits based on specific flavor tags they like." }
            },
            required: ["brand", "name", "reason"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as RecommendedCigar[];
    }
    return [];
  } catch (error) {
    console.error("Recommendation failed", error);
    return [];
  }
};
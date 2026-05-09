import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface ExtractedMenuItem {
  name: string;
  category: string;
  description: string;
  price: number;
  type: 'veg' | 'non-veg';
  isAvailable: boolean;
  status: 'Available' | 'Out of Stock' | 'Seasonal' | 'Chef Special' | 'Hidden';
  prepTime?: string;
  spiceLevel?: number;
  allergens?: string[];
  isRecommended?: boolean;
}

export const extractMenuFromImage = async (base64ImageData: string, mimeType: string): Promise<ExtractedMenuItem[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            data: base64ImageData,
            mimeType: mimeType,
          },
        },
        {
          text: "Extract all menu items from this image/document. For each item, identify the name, price (number only), category, description, and whether it is veg or non-veg. If you see a spicy indicator, set spice level from 1-3. If you see allergens, list them. If it's a chef special or recommended, mark it so.",
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              price: { type: Type.NUMBER },
              type: { type: Type.STRING, enum: ["veg", "non-veg"] },
              isAvailable: { type: Type.BOOLEAN },
              status: { type: Type.STRING, enum: ["Available", "Out of Stock", "Seasonal", "Chef Special", "Hidden"] },
              prepTime: { type: Type.STRING },
              spiceLevel: { type: Type.NUMBER },
              allergens: { type: Type.ARRAY, items: { type: Type.STRING } },
              isRecommended: { type: Type.BOOLEAN },
            },
            required: ["name", "price", "category"],
          },
        },
      },
    });

    const items = JSON.parse(response.text || '[]');
    return items.map((item: any) => ({
      ...item,
      isAvailable: item.isAvailable ?? true,
      status: item.status ?? 'Available',
      type: item.type ?? 'veg',
      spiceLevel: item.spiceLevel ?? 0,
    }));
  } catch (error) {
    console.error("Menu Extraction Error:", error);
    throw error;
  }
};

export const extractMenuFromText = async (text: string): Promise<ExtractedMenuItem[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          text: `Extract all menu items from the following text data:\n\n${text}\n\nFor each item, identify the name, price (number only), category, description, and whether it is veg or non-veg. Set defaults if information is missing.`,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              price: { type: Type.NUMBER },
              type: { type: Type.STRING, enum: ["veg", "non-veg"] },
              isAvailable: { type: Type.BOOLEAN },
              status: { type: Type.STRING, enum: ["Available", "Out of Stock", "Seasonal", "Chef Special", "Hidden"] },
              prepTime: { type: Type.STRING },
              spiceLevel: { type: Type.NUMBER },
              allergens: { type: Type.ARRAY, items: { type: Type.STRING } },
              isRecommended: { type: Type.BOOLEAN },
            },
            required: ["name", "price", "category"],
          },
        },
      },
    });

    const items = JSON.parse(response.text || '[]');
    return items.map((item: any) => ({
      ...item,
      isAvailable: item.isAvailable ?? true,
      status: item.status ?? 'Available',
      type: item.type ?? 'veg',
      spiceLevel: item.spiceLevel ?? 0,
    }));
  } catch (error) {
    console.error("Text Menu Extraction Error:", error);
    throw error;
  }
};

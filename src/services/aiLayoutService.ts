import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface DetectedTable {
  name: string;
  capacity: number;
  type: 'standard' | 'vip' | 'bar' | 'outdoor' | 'booth';
  shape: 'square' | 'round' | 'rectangle' | 'sofa';
  section?: string;
}

export const analyzeLayoutFile = async (file: File): Promise<DetectedTable[]> => {
  const isImage = file.type.startsWith('image/');
  const isText = file.type === 'text/csv' || file.name.endsWith('.csv');
  
  let prompt = `
    Analyze this restaurant table layout draft. 
    Extract a list of tables with their names, seating capacities, types, and shapes.
    
    Types should be one of: 'standard', 'vip', 'bar', 'outdoor', 'booth'.
    Shapes should be one of: 'square', 'round', 'rectangle', 'sofa'.
    
    If it's a CSV, parse the columns accurately.
    If it's an image, detect the table numbers and their relative positions if possible.
  `;

  const contents: any[] = [{ text: prompt }];

  if (isImage) {
    const base64Data = await fileToBase64(file);
    contents.push({
      inlineData: {
        mimeType: file.type,
        data: base64Data.split(',')[1]
      }
    });
  } else {
    const textContent = await file.text();
    contents.push({ text: `Source content:\n${textContent}` });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: contents },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Table number or name" },
              capacity: { type: Type.INTEGER, description: "Number of people" },
              type: { type: Type.STRING, enum: ['standard', 'vip', 'bar', 'outdoor', 'booth'] },
              shape: { type: Type.STRING, enum: ['square', 'round', 'rectangle', 'sofa'] },
              section: { type: Type.STRING, description: "Section name if available" }
            },
            required: ["name", "capacity"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Layout Analysis Error:", error);
    throw new Error("Failed to analyze layout file with AI.");
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

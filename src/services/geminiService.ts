import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getRestaurantInsights(reservations: any[]) {
  if (!process.env.GEMINI_API_KEY) return "AI insights are currently unavailable. Please provide GEMINI_API_KEY.";
  
  const prompt = `Analyze the following restaurant reservations and provide a 2-sentence summary/strategy for the manager.
  Reservations: ${JSON.stringify(reservations)}
  Focus on peak times and staffing needs.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Unable to generate insights.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unable to generate AI insights at this time.";
  }
}

import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI with safety check
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Please configure it in your environment/secrets.");
  }
  return new GoogleGenAI({ apiKey });
};

export async function getRestaurantInsights(reservations: any[]) {
  const prompt = `Analyze the following restaurant reservations and provide a 2-sentence summary/strategy for the manager.
  Reservations: ${JSON.stringify(reservations)}
  Focus on peak times and staffing needs.`;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ text: prompt }],
    });
    return response.text || "Unable to generate insights.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI insights are currently unavailable. Please verify API key configuration.";
  }
}

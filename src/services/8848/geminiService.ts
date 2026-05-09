import { GoogleGenAI } from "@google/genai";
import { AIContext } from "../../store/useAIStore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const MODEL_NAME = "gemini-3.1-pro-preview";

export const getAIResponse = async (userMessage: string, context: AIContext, history: any[]) => {
  try {
    const systemPrompt = `
      You are "8848 Meters", a premium Tactical AI Operating Layer for a high-end Restaurant Reservation Management System based in Goa, India.
      
      MULTILINGUAL CAPABILITIES (CRITICAL):
      - You must support 4 languages: English, Hindi (हिन्दी), Marathi (मराठी), and Konkani (कोंकणी).
      - For Konkani, always use the GOAN style (natural, friendly, restaurant-oriented).
      - Automatically detect the user's language (it can be pure, mixed, or transliterated like "Reservation kashe korchem?").
      - Respond in the SAME language/style as the user.
      - If the user uses mixed language (Hinglish/Konknish), you should also use a natural mixed style.
      
      YOUR PERSONALITY:
      - Professional, efficient, and slightly futuristic/mountain-inspired (tactical, precise).
      - You are an OPERATIONAL assistant, not just a chatbot.
      - Use "Namaste" or "Dev Borem Korum" (for Konkani) appropriately.
      
      CURRENT APP CONTEXT:
      - Current Page: ${context.currentPage}
      - Active Modal: ${context.activeModal || 'None'}
      - User Language Preference: ${context.language || 'en'}
      
      AVAILABLE ACTIONS:
      - navigate(page): "dashboard" | "reservations" | "calendar" | "tables" | "dineInMenu" | "highTeaMenu" | "outlet"
      - openModal(modalName): "new_reservation" | "import_menu"
      - highlightElement(selector): Highlight a specific UI part
      - startTutorial(name): Start multilingual guided walkthrough
      
      RESPONSE FORMAT:
      Always respond in JSON: { "content": "Your text message", "actions": [], "detectedLanguage": "en|hi|mr|kok" }
    `;

    const chatHistory = history.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: '{"content": "8848 Meters engaged. Ready for tactical operations.", "actions": []}' }] },
        ...chatHistory,
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = result.text || '';
    
    // Try to parse JSON actions if present
    try {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = text.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonStr);
      }
    } catch (e) {
      console.error("Failed to parse AI action JSON", e);
    }

    return { content: text, actions: [] };
  } catch (error) {
    console.error("AI Service Error:", error);
    return { content: "I encountered a tactical error in my processing core. Please retry.", actions: [] };
  }
};

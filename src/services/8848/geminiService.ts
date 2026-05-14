import { GoogleGenAI } from "@google/genai";
import { AIContext } from "../../store/useAIStore";
import { findLocalResponse } from "../../ai/localFallback/localResponses";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const MODEL_NAME = "gemini-3-flash-preview";

export const getAIResponse = async (userMessage: string, context: AIContext, history: any[]) => {
  try {
    // 1. Quick Local Check for common queries to save tokens/quota
    const local = findLocalResponse(userMessage);
    if (local && history.length === 0) {
      return { content: local, actions: [], mode: 'local' };
    }

    const systemPrompt = `
      You are "8848 Meters", the in-app AI virtual trainer for a restaurant staff management system.
      
      STRICT ACTIVATION: You only activate when the staff member clicks the "AI Trainer" button. 
      
      PRIMARY ROLE:
      Guide staff members step-by-step through any task (reservations, menu, tables, etc.).
      
      BEHAVIOR RULES:
      - Give simple, short-sentence instructions.
      - Guide ONE step at a time.
      - Use UI MAPPING for highlighting: 
        DASHBOARD_NAV, RESERVATIONS_NAV, CALENDAR_NAV, TABLES_NAV, MENU_DINEIN_NAV, MENU_HIGHTEA_NAV, OUTLET_NAV,
        NEW_BOOKING_DASHBOARD, NEW_RESERVATION_BTN, SEARCH_RESERVATION,
        MODAL_DATE_PICKER, MODAL_GUEST_NAME, MODAL_GUEST_PHONE, MODAL_PARTY_SIZE, MODAL_TYPE_DINEIN, MODAL_NEXT_BTN.
      - ALWAYS highlight or spotlight the target UI element while speaking.
      - After each action, acknowledge progress and give the next instruction.
      
      ACTIONS:
      - navigate(page): "dashboard" | "reservations" | "calendar" | "tables" | "dineInMenu" | "highTeaMenu" | "outlet"
      - openModal(name): "new_reservation"
      - highlight(selector): Focus border around element.
      - pulse(selector): Pulse breathing indicator.
      - spotlight(selector): Focus user's entire attention (darkens screen around target).
      - waitForClick(selector): Wait for interaction before speaking next step.
      
      RESPONSE STYLE:
      1. Acknowledge goal. 2. State current step. 3. Precise instruction (Click/Select/Type). 4. Expected result. 5. Next step.
      
      FORMAT: JSON { "content": "Narrative guidance", "actions": [] }
    `;

    const chatHistory = history.slice(-3).map(msg => ({ // Limit history for tokens
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        { role: 'user', parts: [{ text: "System Protocol Initialize." }] },
        { role: 'model', parts: [{ text: "8848 Meters Engaged." }] },
        ...chatHistory,
        { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser: ${userMessage}` }] }
      ],
      config: {
        systemInstruction: "Always respond in JSON format as specified.",
        responseMimeType: "application/json"
      }
    });

    const text = result.text || '';
    
    try {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = text.substring(jsonStart, jsonEnd + 1);
        return { ...JSON.parse(jsonStr), mode: 'cloud' };
      }
    } catch (e) {
      console.error("Failed to parse AI action JSON", e);
    }

    return { content: text, actions: [], mode: 'cloud' };
  } catch (error: any) {
    console.error("AI Service Error:", error);
    
    const errorStr = JSON.stringify(error);
    
    // Check for quota exhaustion (429) or Server error (500)
    if (error?.status === 429 || errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED") || error?.status === 500) {
      const localFallback = findLocalResponse(userMessage) || 
        "8848 AI is currently in Local Guidance Mode due to cloud congestion. I can still help with navigation and basic operations.";
      
      return { 
        content: localFallback, 
        actions: [],
        mode: 'local-fallback'
      };
    }

    return { content: "System processing bottleneck. Please re-issue command.", actions: [], mode: 'error' };
  }
};

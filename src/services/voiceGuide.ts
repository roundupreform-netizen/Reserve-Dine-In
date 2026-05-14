import { GoogleGenAI } from "@google/genai";

// Supported languages for the app
export type VoiceLanguage = 'en-IN' | 'hi-IN' | 'mr-IN';

// Speech Recognition type definition (since it's a browser API)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

/**
 * PART A: Voice Speaker
 * Speaks text out loud using the Web Speech API
 */
export const speak = (text: string, language: VoiceLanguage = 'en-IN') => {
  // Stop any ongoing speech first
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = 0.9; // Natural, slightly slower pace
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
};

/**
 * Stop any current speech
 */
export const stopSpeaking = () => {
  window.speechSynthesis.cancel();
};

/**
 * PART B: Voice Listener
 * Converts speech to text using the Web Speech API
 */
export const startListening = (
  onResult: (text: string) => void,
  onError: (error: string) => void,
  language: string = 'en-IN'
) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError("Speech recognition is not supported in this browser.");
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = language;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const text = event.results[0][0].transcript;
    onResult(text);
  };

  recognition.onerror = (event: any) => {
    console.error("Speech Recognition Error:", event.error);
    onError(event.error);
  };

  recognition.start();
  return recognition;
};

/**
 * PART F: AI Question Answering
 * Uses Gemini to answer questions based on the current screen context
 */
export const answerVoiceQuestion = async (
  question: string,
  currentScreen: string,
  language: VoiceLanguage = 'en-IN'
) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const errorMsg = "AI Assistant key is missing.";
    speak(errorMsg, language);
    return errorMsg;
  }

  const genAI = new GoogleGenAI({ apiKey });

  try {
    const systemContext = `
      You are a helpful assistant for the "Reserve Dine In" restaurant app.
      The app is built by Everest Developers for restaurants in Goa.
      The user is currently on the "${currentScreen}" screen.
      Answer the user's question in ${language === 'hi-IN' ? 'Hindi' : language === 'mr-IN' ? 'Marathi' : 'English'}.
      Keep your answer very short, maximum 2 sentences.
      Be friendly and guide them to solve their problem.
    `;

    const result = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ text: `${systemContext}\n\nUser Question: ${question}` }]
    });

    const answer = result.text || "I'm sorry, I couldn't process that.";
    
    // Speak the answer automatically
    speak(answer, language);
    
    return answer;
  } catch (error) {
    console.error("Gemini Error:", error);
    const errorMsg = "I'm sorry, I couldn't process that question right now.";
    speak(errorMsg, language);
    return errorMsg;
  }
};

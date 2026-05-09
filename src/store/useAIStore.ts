import { create } from 'zustand';

export interface AIContext {
  currentPage: string;
  activeModal: string | null;
  selectedReservation: any | null;
  uploadState: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  currentErrors: string[];
  lastAction: string | null;
  userRole: string;
  language: string;
}

export interface AIState {
  isOpen: boolean;
  isListening: boolean;
  isThinking: boolean;
  transcript: string;
  messages: { role: 'user' | 'ai'; content: string; actions?: any[] }[];
  context: AIContext;
  
  // Actions
  setIsOpen: (isOpen: boolean) => void;
  setIsListening: (isListening: boolean) => void;
  setIsThinking: (isThinking: boolean) => void;
  addMessage: (message: { role: 'user' | 'ai'; content: string; actions?: any[] }) => void;
  updateContext: (context: Partial<AIContext>) => void;
  clearMessages: () => void;
}

export const useAIStore = create<AIState>((set) => ({
  isOpen: false,
  isListening: false,
  isThinking: false,
  transcript: '',
  messages: [
    { 
      role: 'ai', 
      content: "Namaste. I am 8848 Meters, your tactical operational intelligence. How can I assist with your restaurant's mountain of tasks today?" 
    }
  ],
  context: {
    currentPage: 'dashboard',
    activeModal: null,
    selectedReservation: null,
    uploadState: 'idle',
    currentErrors: [],
    lastAction: null,
    userRole: 'admin',
    language: 'en'
  },

  setIsOpen: (isOpen) => set({ isOpen }),
  setIsListening: (isListening) => set({ isListening }),
  setIsThinking: (isThinking) => set({ isThinking }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateContext: (newContext) => set((state) => ({ 
    context: { ...state.context, ...newContext } 
  })),
  clearMessages: () => set({ messages: [] }),
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  type?: 'text' | 'voice';
}

interface ConversationState {
  messages: Message[];
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  
  addMessage: (role: 'user' | 'assistant', content: string, type?: 'text' | 'voice') => void;
  setIsOpen: (open: boolean) => void;
  setIsMinimized: (minimized: boolean) => void;
  setPosition: (pos: { x: number; y: number }) => void;
  clearMessages: () => void;
}

export const use8848ConversationStore = create<ConversationState>()(
  persist(
    (set) => ({
      messages: [],
      isOpen: false,
      isMinimized: false,
      position: { x: window.innerWidth - 420, y: 100 },

      addMessage: (role, content, type = 'text') => set((state) => ({
        messages: [...state.messages, {
          id: Math.random().toString(36).substring(7),
          role,
          content,
          timestamp: Date.now(),
          type
        }]
      })),

      setIsOpen: (isOpen) => set({ isOpen }),
      setIsMinimized: (isMinimized) => set({ isMinimized }),
      setPosition: (position) => set({ position }),
      clearMessages: () => set({ messages: [] })
    }),
    {
      name: '8848-conversation-storage',
      partialize: (state) => ({ messages: state.messages, position: state.position })
    }
  )
);

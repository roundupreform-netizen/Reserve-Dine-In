import { create } from 'zustand';

interface WalkthroughStep {
  id: string;
  targetId: string;
  title: string;
  description: string;
  narration: {
    en: string;
    hi: string;
    mr: string;
    kok: string;
  };
  actionRequired?: 'click' | 'input' | 'none';
  navigation?: string;
}

interface Walkthrough {
  id: string;
  title: string;
  steps: WalkthroughStep[];
}

interface WalkthroughState {
  activeWalkthrough: Walkthrough | null;
  currentStepIndex: number;
  isNarrationPlaying: boolean;
  isWaitingForAction: boolean;
  completedSteps: string[];
  
  startWalkthrough: (walkthrough: Walkthrough) => void;
  nextStep: () => void;
  prevStep: () => void;
  stopWalkthrough: () => void;
  setNarrationPlaying: (playing: boolean) => void;
  setWaitingForAction: (waiting: boolean) => void;
}

export const use8848WalkthroughStore = create<WalkthroughState>((set) => ({
  activeWalkthrough: null,
  currentStepIndex: -1,
  isNarrationPlaying: false,
  isWaitingForAction: false,
  completedSteps: [],

  startWalkthrough: (walkthrough) => set({ 
    activeWalkthrough: walkthrough, 
    currentStepIndex: 0,
    isWaitingForAction: false,
    completedSteps: []
  }),

  nextStep: () => set((state) => ({ 
    currentStepIndex: state.currentStepIndex + 1,
    isWaitingForAction: false
  })),

  prevStep: () => set((state) => ({ 
    currentStepIndex: Math.max(0, state.currentStepIndex - 1),
    isWaitingForAction: false
  })),

  stopWalkthrough: () => set({ 
    activeWalkthrough: null, 
    currentStepIndex: -1, 
    isNarrationPlaying: false,
    isWaitingForAction: false
  }),

  setNarrationPlaying: (playing) => set({ isNarrationPlaying: playing }),
  setWaitingForAction: (waiting) => set({ isWaitingForAction: waiting }),
}));

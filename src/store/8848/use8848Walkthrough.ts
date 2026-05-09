import { create } from 'zustand';

interface WalkthroughState {
  isActive: boolean;
  currentTutorial: string | null;
  progress: number;
  
  startTutorial: (name: string) => void;
  stopTutorial: () => void;
  setProgress: (progress: number) => void;
}

export const use8848Walkthrough = create<WalkthroughState>((set) => ({
  isActive: false,
  currentTutorial: null,
  progress: 0,

  startTutorial: (name) => set({ isActive: true, currentTutorial: name, progress: 0 }),
  stopTutorial: () => set({ isActive: false, currentTutorial: null, progress: 0 }),
  setProgress: (progress) => set({ progress }),
}));

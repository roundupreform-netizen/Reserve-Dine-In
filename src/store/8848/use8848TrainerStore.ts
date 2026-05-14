import { create } from 'zustand';

interface TrainerState {
  isActive: boolean;
  trainingMode: 'active' | 'passive'; // Active: AI guides, Passive: AI waits for questions
  currentSuggestion: string | null;
  targetElementId: string | null;
  highlightType: 'pulse' | 'spotlight' | 'arrow' | null;
  currentWorkflow: string | null;
  
  toggleTrainer: (active?: boolean) => void;
  setSuggestion: (suggestion: string | null, targetId?: string | null, highlight?: TrainerState['highlightType']) => void;
  setWorkflow: (workflow: string | null) => void;
  resetTrainer: () => void;
}

export const use8848TrainerStore = create<TrainerState>((set) => ({
  isActive: false,
  trainingMode: 'passive',
  currentSuggestion: null,
  targetElementId: null,
  highlightType: null,
  currentWorkflow: null,

  toggleTrainer: (active) => set((state) => ({ 
    isActive: active !== undefined ? active : !state.isActive,
    trainingMode: 'passive'
  })),

  setSuggestion: (suggestion, targetId, highlight) => set({
    currentSuggestion: suggestion,
    targetElementId: targetId || null,
    highlightType: highlight || (targetId ? 'pulse' : null)
  }),

  setWorkflow: (workflow) => set({ currentWorkflow: workflow }),

  resetTrainer: () => set({
    currentSuggestion: null,
    targetElementId: null,
    highlightType: null,
    currentWorkflow: null
  }),
}));

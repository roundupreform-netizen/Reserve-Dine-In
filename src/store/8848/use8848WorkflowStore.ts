import { create } from 'zustand';

interface WorkflowStep {
  id: string;
  label: string;
  completed: boolean;
  timestamp?: number;
}

interface WorkflowState {
  currentWorkflowId: string | null;
  steps: WorkflowStep[];
  activeStepIndex: number;
  
  startWorkflow: (id: string, steps: string[]) => void;
  markStepComplete: (id: string) => void;
  nextStep: () => void;
  resetWorkflow: () => void;
}

export const use8848WorkflowStore = create<WorkflowState>((set) => ({
  currentWorkflowId: null,
  steps: [],
  activeStepIndex: 0,

  startWorkflow: (id, steps) => set({
    currentWorkflowId: id,
    steps: steps.map(s => ({ id: s, label: s, completed: false })),
    activeStepIndex: 0
  }),

  markStepComplete: (id) => set((state) => ({
    steps: state.steps.map(s => s.id === id ? { ...s, completed: true, timestamp: Date.now() } : s)
  })),

  nextStep: () => set((state) => ({
    activeStepIndex: Math.min(state.activeStepIndex + 1, state.steps.length - 1)
  })),

  resetWorkflow: () => set({
    currentWorkflowId: null,
    steps: [],
    activeStepIndex: 0
  })
}));

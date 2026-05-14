import { create } from 'zustand';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'guiding';

interface VoiceStore {
  state: VoiceState;
  transcript: string;
  isContinuous: boolean;
  error: string | null;
  isLocal: boolean;
  
  setState: (state: VoiceState) => void;
  setTranscript: (transcript: string) => void;
  setContinuous: (isContinuous: boolean) => void;
  setError: (error: string | null) => void;
  setLocal: (isLocal: boolean) => void;
  resetVoice: () => void;
}

export const use8848VoiceStore = create<VoiceStore>((set) => ({
  state: 'idle',
  transcript: '',
  isContinuous: false,
  error: null,
  isLocal: false,

  setState: (state) => set({ state }),
  setTranscript: (transcript) => set({ transcript, error: null }),
  setContinuous: (isContinuous) => set({ isContinuous }),
  setLocal: (isLocal) => set({ isLocal }),
  setError: (error) => set({ error, state: 'idle' }),
  resetVoice: () => set({ state: 'idle', transcript: '', isContinuous: false, error: null, isLocal: false }),
}));

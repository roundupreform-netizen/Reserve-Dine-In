import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LanguageState {
  selectedLanguage: string | null;
  onboardingCompleted: boolean;
  setLanguage: (lang: string) => void;
  resetOnboarding: () => void;
}

export const use8848LanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      selectedLanguage: null,
      onboardingCompleted: false,
      setLanguage: (lang) => set({ selectedLanguage: lang, onboardingCompleted: true }),
      resetOnboarding: () => set({ onboardingCompleted: false, selectedLanguage: null }),
    }),
    {
      name: '8848-language-storage',
    }
  )
);

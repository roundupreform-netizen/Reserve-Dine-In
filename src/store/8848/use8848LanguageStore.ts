import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LanguageState {
  selectedLanguage: string | null;
  onboardingCompleted: boolean;
  isMenuOpen: boolean;
  setLanguage: (lang: string) => void;
  toggleMenu: (isOpen?: boolean) => void;
  resetOnboarding: () => void;
}

export const use8848LanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      selectedLanguage: null,
      onboardingCompleted: false,
      isMenuOpen: false,
      setLanguage: (lang) => set({ selectedLanguage: lang, onboardingCompleted: true, isMenuOpen: false }),
      toggleMenu: (isOpen) => set((state) => ({ isMenuOpen: isOpen !== undefined ? isOpen : !state.isMenuOpen })),
      resetOnboarding: () => set({ onboardingCompleted: false, selectedLanguage: null }),
    }),
    {
      name: '8848-language-storage',
    }
  )
);

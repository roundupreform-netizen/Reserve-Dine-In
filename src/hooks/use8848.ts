import { useEffect } from 'react';
import { useAIStore, AIContext } from '../store/useAIStore';
import { useAuth } from '../contexts/AuthContext';

import { useTranslation } from 'react-i18next';

export const useAIContextSync = (currentTab: string, activeModal: string | null = null) => {
  const { updateContext, context } = useAIStore();
  const { user } = useAuth();
  const { i18n } = useTranslation();

  useEffect(() => {
    // Sync current page, user role, and language
    updateContext({
      currentPage: currentTab,
      userRole: user?.email === 'admin@8848.com' ? 'admin' : 'staff', // Example logic
      activeModal: activeModal,
      language: i18n.language
    });
  }, [currentTab, activeModal, user, i18n.language]);

  return {
    context,
    updateContext
  };
};

export const useAIActionEngine = () => {
  // This hook will expose functions that the AI can trigger
  // Like navigation, scrolling, highlighting
  
  const navigateTo = (tab: any) => {
    // This will be used in App.tsx
  };

  return {
    navigateTo
  };
};

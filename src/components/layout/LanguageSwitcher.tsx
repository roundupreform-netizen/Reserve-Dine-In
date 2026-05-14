import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { use8848LanguageStore } from '../../store/8848/use8848LanguageStore';
import { cn } from '../../lib/utils';

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'kok', label: 'KOK' },
  { code: 'mr', label: 'मराठी' },
  { code: 'ne', label: 'नेपाली' },
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const { toggleMenu } = use8848LanguageStore();

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <div className="relative z-50">
      <button
        onClick={() => toggleMenu(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all text-white/50 hover:text-white group shrink-0"
        id="language-selector-button"
      >
        <Globe size={14} className="group-hover:text-purple-400 transition-colors" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{currentLanguage.label}</span>
      </button>
    </div>
  );
};

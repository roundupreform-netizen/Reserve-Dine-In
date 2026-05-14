import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Check, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { use8848LanguageStore } from '../../store/8848/use8848LanguageStore';
import { useAIStore } from '../../store/useAIStore';
import { cn } from '../../lib/utils';

const languages = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧', label: 'EN', color: 'from-blue-500/20 to-indigo-500/20' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳', label: 'हिंदी', color: 'from-orange-500/20 to-red-500/20' },
  { code: 'kok', name: 'Konkani', native: 'कोंकणी', flag: '🌴', label: 'KOK', color: 'from-emerald-500/20 to-teal-500/20' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🟠', label: 'मराठी', color: 'from-amber-500/20 to-orange-500/20' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली', flag: '🇳🇵', label: 'नेपाली', color: 'from-red-500/20 to-blue-500/20' },
];

export const LanguageMenu8848 = () => {
  const { isMenuOpen, toggleMenu, setLanguage, selectedLanguage } = use8848LanguageStore();
  const { updateContext, addMessage, setIsThinking, clearMessages } = useAIStore();
  const { i18n } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        toggleMenu(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, toggleMenu]);

  const handleSelect = async (code: string) => {
    if (code === selectedLanguage) {
      toggleMenu(false);
      return;
    }

    i18n.changeLanguage(code);
    setLanguage(code);
    updateContext({ language: code });
    
    setIsThinking(true);
    clearMessages();
    
    setTimeout(() => {
      const greetingKey = `ai.greeting`;
      addMessage({
        role: 'ai',
        content: i18n.t(greetingKey)
      });
      setIsThinking(false);
    }, 800);
  };

  return (
    <AnimatePresence>
      {isMenuOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-sm bg-[#0A0A0C]/90 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(139,92,246,0.15)] backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Globe size={16} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Intelligence Language</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">8848 Universal Sync</p>
                </div>
              </div>
              <button 
                onClick={() => toggleMenu(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                id="close-language-menu"
              >
                <X size={14} className="text-white/40" />
              </button>
            </div>

            {/* Language Grid */}
            <div className="p-6 grid gap-2">
              {languages.map((lang, idx) => (
                <motion.button
                  key={lang.code}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleSelect(lang.code)}
                  className={cn(
                    "group relative p-4 rounded-2xl flex items-center justify-between transition-all border",
                    selectedLanguage === lang.code 
                      ? "bg-purple-500/10 border-purple-500/30" 
                      : "bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.05]"
                  )}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <span className="text-2xl drop-shadow-lg">{lang.flag}</span>
                    <div className="text-left">
                      <h4 className="text-sm font-black text-white uppercase tracking-tighter transition-colors group-hover:text-purple-400">
                        {lang.native}
                      </h4>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                        {lang.name}
                      </p>
                    </div>
                  </div>

                  {selectedLanguage === lang.code ? (
                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/40">
                      <Check size={12} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Check size={12} className="text-white/20" />
                    </div>
                  )}

                  {/* Hover Glow Effect */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl bg-gradient-to-r",
                    lang.color
                  )} />
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 bg-white/[0.01] border-t border-white/5 flex items-center justify-center gap-2">
              <Sparkles size={12} className="text-purple-500/40" />
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Neural Engine Synchronization</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

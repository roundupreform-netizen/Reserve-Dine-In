import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Globe, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { use8848LanguageStore } from '../../store/8848/use8848LanguageStore';
import { useAIStore } from '../../store/useAIStore';
import { cn } from '../../lib/utils';

const languages = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧', color: 'from-blue-500/20 to-indigo-500/20' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳', color: 'from-orange-500/20 to-red-500/20' },
  { code: 'kok', name: 'Konkani', native: 'कोंकणी', flag: '🌴', color: 'from-emerald-500/20 to-teal-500/20' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🟠', color: 'from-amber-500/20 to-orange-500/20' },
];

export const LanguageSelector8848 = () => {
  const { setLanguage } = use8848LanguageStore();
  const { updateContext, addMessage, setIsThinking, clearMessages } = useAIStore();
  const { i18n, t } = useTranslation();

  const handleSelect = async (code: string) => {
    i18n.changeLanguage(code);
    setLanguage(code);
    updateContext({ language: code });
    
    setIsThinking(true);
    clearMessages();
    
    // Initial greeting in selected language with a bit of "thinking" flair
    setTimeout(() => {
      const greetingKey = `ai.greeting`;
      addMessage({
        role: 'ai',
        content: i18n.t(greetingKey)
      });
      setIsThinking(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(139,92,246,0.3)]"
      >
        <Globe className="text-purple-400" size={32} />
      </motion.div>

      <motion.h2
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-black text-white tracking-tight uppercase mb-2"
      >
        Select Intelligence Language
      </motion.h2>
      
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] mb-8"
      >
        Which language are you comfortable in?
      </motion.p>

      <div className="grid grid-cols-2 gap-3 w-full">
        {languages.map((lang, idx) => (
          <motion.button
            key={lang.code}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (idx * 0.1) }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(lang.code)}
            className={cn(
              "relative group p-4 rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden text-left transition-all hover:border-white/30",
              "before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-0 group-hover:before:opacity-100 before:transition-opacity",
              lang.color.split(' ').map(c => `before:${c}`).join(' ')
            )}
          >
            <div className="relative z-10">
              <span className="text-2xl mb-2 block">{lang.flag}</span>
              <h3 className="text-sm font-black text-white uppercase tracking-tighter leading-none mb-1">{lang.native}</h3>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{lang.name}</p>
            </div>
            
            <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
              <ArrowRight size={14} className="text-white" />
            </div>
          </motion.button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 flex items-center gap-2 text-[10px] text-white/20 font-black uppercase tracking-widest"
      >
        <Sparkles size={12} />
        Auto-detection Active
      </motion.div>
    </div>
  );
};

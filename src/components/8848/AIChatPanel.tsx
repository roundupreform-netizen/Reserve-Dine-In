import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Mic, Sparkles, X, Zap, Target, Globe, BookOpen } from 'lucide-react';
import { useAIStore } from '../../store/useAIStore';
import { use8848Diagnostics } from '../../store/8848/use8848Diagnostics';
import { conversationEngine } from '../../voice/8848ConversationEngine';
import { trainerEngine } from '../../services/8848/8848TrainerEngine';
import { use8848TrainerStore } from '../../store/8848/use8848TrainerStore';
import { getAIResponse } from '../../services/8848/geminiService';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import Logo8848 from './8848Logo';
import { useTranslation } from 'react-i18next';

import VoiceAI from './VoiceAI';

import { use8848LanguageStore } from '../../store/8848/use8848LanguageStore';
import { LanguageSelector8848 } from './8848LanguageSelector';

const AIChatPanel = () => {
  const { messages, addMessage, isThinking, setIsThinking, context, setIsOpen, updateContext, isOpen } = useAIStore();
  const { startScan } = use8848Diagnostics();
  const { onboardingCompleted, toggleMenu } = use8848LanguageStore();
  const { isActive: isTrainerActive } = use8848TrainerStore();
  const [input, setInput] = useState('');
  const { t, i18n } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-trigger language selection on first open
  useEffect(() => {
    if (isOpen && !onboardingCompleted) {
      setTimeout(() => toggleMenu(true), 500);
    }
  }, [isOpen, onboardingCompleted, toggleMenu]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking, onboardingCompleted]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMessage = input.trim();
    setInput('');

    if (isTrainerActive) {
      trainerEngine.handleUserQuestion(userMessage);
      return;
    }

    addMessage({ role: 'user', content: userMessage });
    setIsThinking(true);

    try {
      const response = await getAIResponse(userMessage, context, messages);
      
      addMessage({ 
        role: 'ai', 
        content: response.content,
        actions: response.actions 
      });

      // Update context language if detected
      if (response.detectedLanguage && response.detectedLanguage !== i18n.language) {
        i18n.changeLanguage(response.detectedLanguage);
        updateContext({ language: response.detectedLanguage });
        toast.success(t('ai.languageDetected'), {
          icon: <Sparkles className="text-amber-500" size={16} />
        });
      }

      // Handle Actions (Action Engine)
      if (response.actions && response.actions.length > 0) {
        response.actions.forEach((action: any) => {
          handleAIAction(action);
        });
      }
    } catch (e) {
      toast.error("Tactical link failed. Retry connection.");
    } finally {
      setIsThinking(false);
    }
  };

  const handleAIAction = (action: any) => {
    console.log("Executing Tactical Action:", action);
    // This will be expanded in the use8848 hook integration
    toast.success(`8848 Executing: ${action.type}`, {
      icon: <Logo8848 size={16} glow={false} animated={false} />,
      style: { background: '#121215', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
    });
  };

  return (
    <div className="w-[450px] h-[650px] bg-[#0A0A0C] border border-white/10 rounded-[2.5rem] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl">
      {/* Header */}
      <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo8848 
            size={56} 
            state={isThinking ? 'thinking' : 'idle'} 
            className="shrink-0"
          />
          <div>
            <h3 className="text-xl font-black text-white tracking-tighter uppercase leading-none">{t('ai.title')}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{t('ai.tacticalActive', 'Tactical Core Active')}</span>
            </div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
          <X size={18} className="text-white/40" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
        {!onboardingCompleted ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
            <Globe className="text-white animate-pulse" size={48} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Synchronizing Global Intelligence...</p>
            <button 
              onClick={() => toggleMenu(true)}
              className="text-[10px] px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Manual Language Select
            </button>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex flex-col max-w-[85%]",
                  msg.role === 'user' ? "ml-auto items-end" : "items-start"
                )}
              >
                <div className={cn(
                  "p-4 rounded-3xl text-sm leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-amber-500 text-black font-medium rounded-tr-none" 
                    : "bg-white/5 text-white/80 border border-white/5 rounded-tl-none"
                )}>
                  {msg.content}
                </div>
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-2">
                  {msg.role === 'user' ? t('ai.operator') : t('ai.response')}
                </span>
                
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {msg.actions.map((action: any, ai) => (
                      <div key={ai} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
                        <Target size={10} className="text-emerald-500" />
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Executing {action.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </>
        )}
        {isThinking && (
          <div className="flex flex-col items-start max-w-[85%]">
            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl rounded-tl-none flex items-center gap-3">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 rounded-full bg-amber-500" />
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-amber-500/60" />
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-amber-500/30" />
            </div>
            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-2">{t('ai.thinking')}</span>
          </div>
        )}
      </div>

      {/* Input */}
      {onboardingCompleted && (
        <div className="p-8 border-t border-white/5 bg-white/[0.02]">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('ai.placeholder')}
              className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-6 pr-24 text-xs font-medium text-white outline-none focus:border-amber-500/50 transition-all placeholder:text-white/20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <VoiceAI />
              <button 
                onClick={handleSend}
                className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button 
              onClick={() => {
                setIsOpen(false);
                startScan();
              }}
              className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 transition-all text-left flex items-center gap-3 group"
            >
              <Zap size={14} className="text-amber-500" />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest group-hover:text-white">{t('ai.diagnostics')}</span>
            </button>
            <button 
              onClick={() => {
                setIsOpen(false);
                conversationEngine.startVoiceSupport();
              }}
              className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all text-left flex items-center gap-3 group"
            >
              <BookOpen size={14} className="text-blue-500" />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest group-hover:text-white">Live AI Trainer</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatPanel;

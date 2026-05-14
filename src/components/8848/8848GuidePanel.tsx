import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { use8848TrainerStore } from '../../store/8848/use8848TrainerStore';
import { conversationEngine } from '../../voice/8848ConversationEngine';
import { X, Mic, RefreshCcw, HelpCircle, Power } from 'lucide-react';
import Logo8848 from './8848Logo';

export const GuidePanel8848: React.FC = () => {
  const { isActive, currentSuggestion, resetTrainer } = use8848TrainerStore();

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        className="fixed top-24 right-8 z-[220] w-80"
      >
        <div className="bg-[#0A0A0C]/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Logo8848 size={32} state="thinking" glow />
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest">AI Trainer</h3>
                <p className="text-[8px] text-blue-500 font-bold uppercase tracking-tighter">Operational Guide Active</p>
              </div>
            </div>
            <button 
              onClick={() => conversationEngine.stopVoiceSupport()}
              className="p-2 bg-white/5 rounded-full hover:bg-red-500/20 text-white/40 hover:text-red-500 transition-all"
            >
              <Power size={14} />
            </button>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-4">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">Instructions</p>
            <p className="text-sm text-white/80 font-medium leading-relaxed">
              {currentSuggestion || "Awaiting your command. Ask 'What's next?' to begin the workflow."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => conversationEngine.startVoiceSupport()}
              className="flex items-center justify-center gap-2 p-3 bg-blue-600 rounded-xl hover:bg-blue-500 transition-all text-white"
            >
              <HelpCircle size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Help Me</span>
            </button>
            <button 
              onClick={() => {
                resetTrainer();
                conversationEngine.startVoiceSupport();
              }}
              className="flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-white/60"
            >
              <RefreshCcw size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Restart</span>
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center">
             <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full">
                <Mic size={10} className="text-blue-500 animate-pulse" />
                <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Voice Control Active</span>
             </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

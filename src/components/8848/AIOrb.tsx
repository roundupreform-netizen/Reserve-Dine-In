import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Mic, X, MessageSquare, AlertCircle, Sparkles, ChevronUp, History } from 'lucide-react';
import { useAIStore } from '../../store/useAIStore';
import { cn } from '../../lib/utils';
import AIChatPanel from './AIChatPanel';
import Logo8848 from './8848Logo';

const AIOrb = () => {
  const { isOpen, setIsOpen, isListening, isThinking, context } = useAIStore();
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (context.currentErrors.length > 0) {
      setShowStatus(true);
      const timer = setTimeout(() => setShowStatus(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [context.currentErrors]);

  const getOrbState = () => {
    if (context.currentErrors.length > 0) return 'warning';
    if (isThinking) return 'thinking';
    if (isListening) return 'listening';
    return 'idle';
  };

  return (
    <div className="fixed bottom-8 right-8 z-[200] flex flex-col items-end gap-4">
      {/* AI Messages Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="mb-4"
          >
            <AIChatPanel />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Indicators */}
      <AnimatePresence>
        {showStatus && context.currentErrors.length > 0 && !isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center gap-3 bg-red-500/20 backdrop-blur-xl border border-red-500/30 px-4 py-2 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest shadow-2xl"
          >
            <AlertCircle size={14} />
            <span>Problem Detected: {context.currentErrors[0]}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Orb */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative group outline-none"
      >
        <Logo8848 
          size={isOpen ? 72 : 64}
          state={getOrbState()}
          glow
          pulse
          animated={isThinking || isListening}
          className={cn(
            "transition-all duration-500",
            isOpen ? "scale-110" : ""
          )}
        />
        
        {/* Toggle Icon overlay when open */}
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
          >
             <X size={20} className="text-white drop-shadow-lg" />
          </motion.div>
        )}

        {/* Active Tooltip */}
        {!isOpen && context.currentErrors.length === 0 && (
          <div className="absolute top-0 right-0 w-4 h-4 bg-amber-500 rounded-full border-2 border-[#0A0A0C] z-30 shadow-lg shadow-amber-500/50" />
        )}
      </motion.button>
    </div>
  );
};

export default AIOrb;

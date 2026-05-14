import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { use8848VoiceStore } from '../../store/8848/use8848VoiceStore';
import { Mic, Volume2, Loader2, X } from 'lucide-react';

export const VoiceGuide8848: React.FC = () => {
  const { state, transcript, error, isLocal, resetVoice } = use8848VoiceStore();

  if (state === 'idle' && !error) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[250] w-full max-w-md px-4 pointer-events-none"
      >
        <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
          {/* Animated Waveform */}
          <div className="flex items-end gap-1 h-8 mb-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  height: state === 'listening' ? [8, 24, 12, 32, 8] : 8,
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 0.5 + i * 0.1,
                  ease: "easeInOut"
                }}
                className={`w-1 rounded-full ${isLocal ? 'bg-amber-500' : state === 'listening' ? 'bg-blue-500' : 'bg-white/20'}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${error ? 'bg-red-500' : isLocal ? 'bg-amber-500' : state === 'listening' ? 'bg-blue-500 animate-pulse' : 'bg-white/10'}`}>
              {error ? <X size={16} className="text-white" onClick={() => resetVoice()} /> :
               state === 'listening' ? <Mic size={16} className="text-white" /> : 
               state === 'thinking' ? <Loader2 size={16} className="text-white animate-spin" /> :
               <Volume2 size={16} className="text-white" />}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                  {error ? 'System Error' :
                   isLocal ? '8848 Local Mode' :
                   state === 'listening' ? 'Listening...' : 
                   state === 'thinking' ? 'Analyzing Context...' : 
                   state === 'speaking' ? '8848 Speaking' : 
                   state === 'guiding' ? 'Tactical Guidance' : 'Operational Guide'}
                </span>
                {isLocal && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[8px] font-bold text-amber-500 uppercase">
                    Offline Mode
                  </span>
                )}
              </div>
              <p className={`text-sm font-medium italic line-clamp-2 ${error ? 'text-red-400' : 'text-white'}`}>
                {error || transcript || "Speak clearly into the microphone..."}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

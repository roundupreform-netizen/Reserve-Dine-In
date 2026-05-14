import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mic, Send, MicOff } from 'lucide-react';
import { use8848VoiceStore } from '../../store/8848/use8848VoiceStore';
import { voiceRecognition } from '../../services/8848/8848SpeechRecognition';
import { use8848ConversationStore } from '../../store/8848/use8848ConversationStore';
import { trainerEngine } from '../../services/8848/8848TrainerEngine';
import { cn } from '../../lib/utils';

export const VoiceControls8848: React.FC = () => {
  const { state, transcript } = use8848VoiceStore();
  const { addMessage } = use8848ConversationStore();
  const [inputText, setInputText] = useState('');

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    addMessage('user', text, 'text');
    setInputText('');
    await trainerEngine.handleUserQuestion(text);
  };

  const toggleMic = () => {
    if (state === 'listening') {
      voiceRecognition.stop();
    } else {
      voiceRecognition.start();
    }
  };

  return (
    <div className="p-4 bg-white/[0.03] border-t border-white/5 space-y-4">
      {/* Transcript feedback */}
      {state === 'listening' && transcript && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-amber-500/80 font-medium italic px-2 truncate"
        >
          "{transcript}..."
        </motion.div>
      )}

      <div className="flex items-end gap-3">
        <div className="flex-1 relative group">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.05] transition-all resize-none min-h-[44px] max-h-[120px]"
            rows={1}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleMic}
            className={cn(
              "w-11 h-11 flex items-center justify-center rounded-xl transition-all shadow-lg",
              state === 'listening' 
                ? "bg-red-500 text-white animate-pulse shadow-red-500/20" 
                : "bg-white/[0.05] text-white/60 hover:text-white hover:bg-white/[0.1] border border-white/5"
            )}
          >
            {state === 'listening' ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={cn(
              "w-11 h-11 flex items-center justify-center rounded-xl transition-all shadow-lg",
              inputText.trim()
                ? "bg-amber-500 text-black shadow-amber-500/20"
                : "bg-white/[0.02] text-white/10 cursor-not-allowed border border-white/5"
            )}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Minus, 
  GripHorizontal,
  Bot
} from 'lucide-react';
import { use8848ConversationStore } from '../../store/8848/use8848ConversationStore';
import { use8848TrainerStore } from '../../store/8848/use8848TrainerStore';

export const ChatHeader8848: React.FC = () => {
  const { setIsOpen, setIsMinimized } = use8848ConversationStore();
  const { isActive } = use8848TrainerStore();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/5 cursor-grab active:cursor-grabbing" id="chat-8848-drag-handle">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="p-1.5 bg-amber-500 rounded-lg shadow-lg shadow-amber-500/20">
            <Bot size={18} className="text-black" />
          </div>
          {isActive && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full border-2 border-[#121212] animate-pulse" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-black uppercase tracking-widest text-white/40">operational</span>
          <span className="text-sm font-black uppercase text-white">8848 Meters</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button 
          onClick={() => setIsMinimized(true)}
          className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
        >
          <Minus size={16} />
        </button>
        <button 
          onClick={() => setIsOpen(false)}
          className="p-1.5 hover:bg-red-500/20 rounded-lg text-white/40 hover:text-red-400 transition-colors"
        >
          <X size={16} />
        </button>
        <div className="ml-2 text-white/20">
          <GripHorizontal size={16} />
        </div>
      </div>
    </div>
  );
};

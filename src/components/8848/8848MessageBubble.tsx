import React from 'react';
import { motion } from 'motion/react';
import { use8848ConversationStore } from '../../store/8848/use8848ConversationStore';
import { cn } from '../../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const MessageBubble8848: React.FC<{ message: Message }> = ({ message }) => {
  const isAI = message.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex w-full mb-4",
        isAI ? "justify-start" : "justify-end"
      )}
    >
      <div className={cn(
        "max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
        isAI 
          ? "bg-white/[0.05] text-white border border-white/10 rounded-tl-none" 
          : "bg-amber-500 text-black font-medium rounded-tr-none"
      )}>
        {message.content}
        <div className={cn(
          "text-[10px] mt-1 opacity-40",
          isAI ? "text-white" : "text-black"
        )}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
};

import React, { useEffect, useRef } from 'react';
import { use8848ConversationStore } from '../../store/8848/use8848ConversationStore';
import { MessageBubble8848 } from './8848MessageBubble';
import { AnimatePresence } from 'motion/react';

export const ConversationList8848: React.FC = () => {
  const { messages } = use8848ConversationStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar scroll-smooth"
    >
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <MessageBubble8848 key={msg.id} message={msg} />
        ))}
      </AnimatePresence>
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-8">
          <div className="w-12 h-12 border-2 border-dashed border-white/20 rounded-full mb-4 flex items-center justify-center">
            <span className="text-xl">∞</span>
          </div>
          <p className="text-xs uppercase tracking-widest font-black">
            System Idle. Waiting for activation.
          </p>
        </div>
      )}
    </div>
  );
};

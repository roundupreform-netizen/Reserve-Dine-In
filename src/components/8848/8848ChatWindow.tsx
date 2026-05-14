import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Draggable from 'react-draggable';
import { use8848ConversationStore } from '../../store/8848/use8848ConversationStore';
import { ChatHeader8848 } from './8848ChatHeader';
import { ConversationList8848 } from './8848ConversationList';
import { VoiceControls8848 } from './8848VoiceControls';
import { use8848VoiceStore } from '../../store/8848/use8848VoiceStore';
import { Bot, Maximize2 } from 'lucide-react';
import { cn } from '../../lib/utils';

import { TypingIndicator8848 } from './8848TypingIndicator';

export const ChatWindow8848: React.FC = () => {
  const { isOpen, isMinimized, setIsMinimized, position, setPosition } = use8848ConversationStore();
  const { state } = use8848VoiceStore();
  const nodeRef = useRef(null);

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {!isMinimized ? (
          <Draggable
            nodeRef={nodeRef}
            handle="#chat-8848-drag-handle"
            position={position}
            onStop={(e, data) => setPosition({ x: data.x, y: data.y })}
            bounds="parent"
          >
            <motion.div
              ref={nodeRef}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed z-[9990] w-[380px] h-[550px] bg-[#121212] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
            >
              {/* Futuristic Background Accents */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
              
              <ChatHeader8848 />
              <ConversationList8848 />
              
              {state === 'thinking' && (
                <div className="flex items-center gap-2">
                  <TypingIndicator8848 />
                  <span className="text-[10px] uppercase font-black tracking-widest text-white/30">Analyzing tactical data...</span>
                </div>
              )}

              <VoiceControls8848 />
            </motion.div>
          </Draggable>
        ) : (
          /* Minimized Bubble */
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => setIsMinimized(false)}
            className="fixed bottom-8 right-8 z-[9990] w-16 h-16 bg-amber-500 rounded-2xl shadow-xl shadow-amber-500/30 flex items-center justify-center group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            <Bot size={30} className="text-black relative z-10" />
            
            {state === 'listening' && (
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-white"
              />
            )}

            <div className="absolute -top-1 -right-1">
               <motion.div 
                 animate={{ scale: [1, 1.2, 1] }} 
                 transition={{ repeat: Infinity, duration: 2 }}
                 className="bg-cyan-400 p-1 rounded-full border-2 border-[#121212]"
               >
                 <Maximize2 size={10} className="text-black" />
               </motion.div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};

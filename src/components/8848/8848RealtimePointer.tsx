import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { use8848TrainerStore } from '../../store/8848/use8848TrainerStore';
import { MousePointer2 } from 'lucide-react';

export const RealtimePointer8848: React.FC = () => {
  const { targetElementId, isActive } = use8848TrainerStore();
  const [pos, setPos] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    if (!targetElementId || !isActive) {
      setPos(null);
      return;
    }

    const updatePos = () => {
      const el = document.getElementById(targetElementId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setPos({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      }
    };

    updatePos();
    const interval = setInterval(updatePos, 100); // Track if element moves
    
    return () => clearInterval(interval);
  }, [targetElementId, isActive]);

  if (!pos || !isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          x: pos.x,
          y: pos.y
        }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ type: 'spring', damping: 15 }}
        className="fixed z-[260] pointer-events-none"
        style={{ left: -12, top: -12 }} // Offset to center the pointer
      >
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute -inset-4 bg-blue-500/20 rounded-full blur-xl"
          />
          <MousePointer2 size={24} className="text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)] fill-blue-500" />
          
          <motion.div
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 30 }}
             className="absolute left-full top-0 whitespace-nowrap bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg"
          >
            Tactical Focus
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

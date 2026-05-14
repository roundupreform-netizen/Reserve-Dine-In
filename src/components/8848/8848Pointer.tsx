import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MousePointer2 } from 'lucide-react';

export const AIPointer8848: React.FC = () => {
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleAction = (e: any) => {
      if (!e?.detail?.selector) return;
      const { selector } = e.detail;
      const el = document.querySelector(selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTarget({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
        
        setTimeout(() => setTarget(null), 4000);
      }
    };

    window.addEventListener('8848-pointer-active', handleAction);
    return () => window.removeEventListener('8848-pointer-active', handleAction);
  }, []);

  if (!target) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 2 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          left: target.x,
          top: target.y
        }}
        exit={{ opacity: 0, scale: 2 }}
        className="fixed z-[200] pointer-events-none text-amber-500"
        style={{ transform: 'translate(-50%, -100%)' }}
      >
        <div className="relative">
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <MousePointer2 size={32} fill="currentColor" stroke="white" strokeWidth={2} />
          </motion.div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-4 bg-amber-500 rounded-full blur-lg animate-pulse" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

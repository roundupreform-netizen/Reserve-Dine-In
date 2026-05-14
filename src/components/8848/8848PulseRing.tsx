import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const PulseRing8848: React.FC = () => {
  const [activeSelectors, setActiveSelectors] = useState<string[]>([]);

  useEffect(() => {
    const handlePulse = (e: any) => {
      if (!e?.detail?.selector) return;
      const { selector } = e.detail;
      setActiveSelectors(prev => [...prev, selector]);
      setTimeout(() => {
        setActiveSelectors(prev => prev.filter(s => s !== selector));
      }, 6000);
    };

    const handleClear = () => setActiveSelectors([]);

    window.addEventListener('8848-guidance-pulse', handlePulse);
    window.addEventListener('8848-guidance-clear', handleClear);
    return () => {
      window.removeEventListener('8848-guidance-pulse', handlePulse);
      window.removeEventListener('8848-guidance-clear', handleClear);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none overflow-hidden">
      <AnimatePresence>
        {activeSelectors.map((selector, idx) => {
          const el = document.querySelector(selector);
          if (!el) return null;
          const rect = el.getBoundingClientRect();

          return (
            <motion.div
              key={`pulse-${selector}-${idx}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute pointer-events-none"
              style={{
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
              }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-[-10px] border-4 border-cyan-500 rounded-xl"
              />
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.8, 0.4, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
                className="absolute inset-[-4px] border-2 border-amber-500 rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.5)]"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

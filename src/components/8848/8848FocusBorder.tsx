import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const FocusBorder8848: React.FC = () => {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    const handleFocus = (e: any) => {
      if (!e?.detail?.selector) return;
      setTarget(e.detail.selector);
      setTimeout(() => setTarget(null), 10000);
    };
    const handleClear = () => setTarget(null);

    window.addEventListener('8848-guidance-focus', handleFocus);
    window.addEventListener('8848-guidance-clear', handleClear);
    return () => {
      window.removeEventListener('8848-guidance-focus', handleFocus);
      window.removeEventListener('8848-guidance-clear', handleClear);
    };
  }, []);

  if (!target) return null;
  const el = document.querySelector(target);
  if (!el) return null;
  const rect = el.getBoundingClientRect();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed z-[900] pointer-events-none"
        style={{
          left: rect.left - 4,
          top: rect.top - 4,
          width: rect.width + 8,
          height: rect.height + 8,
          border: '3px solid #06b6d4',
          borderRadius: '12px',
          boxShadow: '0 0 40px rgba(6,182,212,0.3), inset 0 0 20px rgba(6,182,212,0.2)',
        }}
      >
        <div className="absolute -top-3 -left-3 w-6 h-6 border-t-4 border-l-4 border-cyan-400" />
        <div className="absolute -top-3 -right-3 w-6 h-6 border-t-4 border-r-4 border-cyan-400" />
        <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-4 border-l-4 border-cyan-400" />
        <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-4 border-r-4 border-cyan-400" />
      </motion.div>
    </AnimatePresence>
  );
};

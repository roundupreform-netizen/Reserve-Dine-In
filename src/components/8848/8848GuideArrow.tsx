import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowDown } from 'lucide-react';

export const GuideArrow8848: React.FC = () => {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    const handleArrow = (e: any) => {
      if (!e?.detail?.selector) return;
      setTarget(e.detail.selector);
      setTimeout(() => setTarget(null), 8000);
    };
    const handleClear = () => setTarget(null);

    window.addEventListener('8848-guidance-arrow', handleArrow);
    window.addEventListener('8848-guidance-clear', handleClear);
    return () => {
      window.removeEventListener('8848-guidance-arrow', handleArrow);
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
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed z-[1100] text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
        style={{
          left: rect.left + rect.width / 2 - 20,
          top: rect.top - 60,
        }}
      >
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <ArrowDown size={40} strokeWidth={3} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

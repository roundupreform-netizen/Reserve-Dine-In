import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const ActionPulse8848: React.FC = () => {
  const [pulse, setPulse] = useState<{ x: number, y: number, id: string } | null>(null);

  useEffect(() => {
    const handlePulse = (e: any) => {
      if (!e?.detail?.selector) return;
      const { selector } = e.detail;
      const el = document.querySelector(selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setPulse({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          id: Math.random().toString()
        });
        
        setTimeout(() => setPulse(null), 3000);
      }
    };

    window.addEventListener('8848-pulse-active', handlePulse);
    return () => window.removeEventListener('8848-pulse-active', handlePulse);
  }, []);

  if (!pulse) return null;

  return (
    <div className="fixed inset-0 z-[160] pointer-events-none overflow-hidden">
      <motion.div
        key={pulse.id}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5], opacity: [1, 0] }}
        transition={{ duration: 1, repeat: 2 }}
        className="absolute border-4 border-amber-500 rounded-full"
        style={{
          left: pulse.x - 50,
          top: pulse.y - 50,
          width: 100,
          height: 100,
          transform: 'translate(-50%, -50%)'
        }}
      />
    </div>
  );
};

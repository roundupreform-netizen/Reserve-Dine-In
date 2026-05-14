import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface HighlightState {
  selector: string;
  type: 'pulse' | 'spotlight' | 'border' | 'arrow';
  rect: DOMRect | null;
}

export const VisualGuide8848: React.FC = () => {
  const [activeHighlights, setActiveHighlights] = useState<HighlightState[]>([]);

  useEffect(() => {
    const handlePulse = (e: any) => {
      if (!e?.detail?.selector) return;
      const selector = e.detail.selector;
      const el = document.querySelector(selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setActiveHighlights(prev => [...prev, { selector, type: 'pulse', rect }]);
        setTimeout(() => {
          setActiveHighlights(prev => prev.filter(h => h.selector !== selector || h.type !== 'pulse'));
        }, 5000);
      }
    };

    const handleSpotlight = (e: any) => {
      if (!e?.detail?.selector) return;
      const selector = e.detail.selector;
      const el = document.querySelector(selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setActiveHighlights(prev => [...prev, { selector, type: 'spotlight', rect }]);
      }
    };

    const handleClear = () => {
      setActiveHighlights([]);
    };

    window.addEventListener('8848-pulse-active', handlePulse);
    window.addEventListener('8848-spotlight-active', handleSpotlight);
    window.addEventListener('8848-clear-highlights', handleClear);

    return () => {
      window.removeEventListener('8848-pulse-active', handlePulse);
      window.removeEventListener('8848-spotlight-active', handleSpotlight);
      window.removeEventListener('8848-clear-highlights', handleClear);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {activeHighlights.map((hl, idx) => {
          if (!hl.rect) return null;

          if (hl.type === 'pulse') {
            return (
              <motion.div
                key={`pulse-${idx}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  left: hl.rect.left,
                  top: hl.rect.top,
                  width: hl.rect.width,
                  height: hl.rect.height,
                  border: '2px solid #06b6d4',
                  borderRadius: 'inherit',
                  boxShadow: '0 0 20px #06b6d4',
                }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.2, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-[-10px] border-2 border-cyan-500 rounded-lg"
                />
              </motion.div>
            );
          }

          if (hl.type === 'spotlight') {
            return (
              <motion.div
                key={`spotlight-${idx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60"
                style={{
                  clipPath: `path('M0,0H${window.innerWidth}V${window.innerHeight}H0V0ZM${hl.rect.left},${hl.rect.top}H${hl.rect.left + hl.rect.width}V${hl.rect.top + hl.rect.height}H${hl.rect.left}V${hl.rect.top}Z')`,
                  fillRule: 'evenodd'
                }}
              />
            );
          }

          return null;
        })}
      </AnimatePresence>
    </div>
  );
};

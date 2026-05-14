import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const Spotlight8848: React.FC = () => {
  const [active, setActive] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    const handleSpotlight = (e: any) => {
      if (!e?.detail?.selector) return;
      const { selector } = e.detail;
      const el = document.querySelector(selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setCoords({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          width: rect.width,
          height: rect.height
        });
        setActive(true);
        
        // Auto-disable after 10 seconds
        setTimeout(() => setActive(false), 10000);
      }
    };

    const handleClear = () => setActive(false);

    window.addEventListener('8848-guidance-spotlight', handleSpotlight);
    window.addEventListener('8848-guidance-clear', handleClear);
    return () => {
      window.removeEventListener('8848-guidance-spotlight', handleSpotlight);
      window.removeEventListener('8848-guidance-clear', handleClear);
    };
  }, []);

  if (!active) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[800] pointer-events-none bg-black/60"
        style={{
          clipPath: `path('M0,0H${window.innerWidth}V${window.innerHeight}H0V0ZM${coords.x - coords.width/2},${coords.y - coords.height/2}H${coords.x + coords.width/2}V${coords.y + coords.height/2}H${coords.x - coords.width/2}V${coords.y - coords.height/2}Z')`,
        }}
      >
        {/* Glow indicator at the cut-out */}
        <div 
          style={{
            position: 'absolute',
            left: coords.x - coords.width/2 - 10,
            top: coords.y - coords.height/2 - 10,
            width: coords.width + 20,
            height: coords.height + 20,
            border: '2px solid rgba(6,182,212,0.5)',
            boxShadow: '0 0 50px rgba(6,182,212,0.3)',
            borderRadius: '12px'
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

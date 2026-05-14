import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { use8848TrainerStore } from '../../store/8848/use8848TrainerStore';
import { ChevronDown } from 'lucide-react';

export const ScreenHighlight8848: React.FC = () => {
  const { targetElementId, highlightType, isActive } = use8848TrainerStore();
  const [coords, setCoords] = useState<{ x: number, y: number, width: number, height: number } | null>(null);

  useEffect(() => {
    if (!targetElementId || !isActive) {
      setCoords(null);
      return;
    }

    const updatePosition = () => {
      const el = document.getElementById(targetElementId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setCoords({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        });
        
        // Ensure element is in view
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [targetElementId, isActive]);

  if (!coords || !isActive) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none z-[210]">
        {/* Spotlight Effect */}
        {highlightType === 'spotlight' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            style={{
              maskImage: `radial-gradient(circle at ${coords.x + coords.width/2}px ${coords.y + coords.height/2}px, transparent 0%, transparent 100px, black 150px)`,
              WebkitMaskImage: `radial-gradient(circle at ${coords.x + coords.width/2}px ${coords.y + coords.height/2}px, transparent 0%, transparent 100px, black 150px)`
            }}
          />
        )}

        {/* Animated Pointer / Arrow */}
        {highlightType === 'arrow' && (
          <motion.div
            initial={{ y: coords.y - 40, opacity: 0 }}
            animate={{ y: coords.y - 20, opacity: 1 }}
            transition={{ repeat: Infinity, duration: 1, repeatType: 'reverse' }}
            className="absolute flex flex-col items-center"
            style={{ left: coords.x + coords.width / 2 - 20, top: coords.y - 60 }}
          >
            <div className="bg-blue-500 text-white p-2 rounded-full shadow-lg">
              <ChevronDown size={24} />
            </div>
          </motion.div>
        )}

        {/* Glow / Pulse around element */}
        {highlightType === 'pulse' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 1 }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute border-4 border-blue-500 rounded-lg shadow-[0_0_30px_rgba(59,130,246,0.6)]"
            style={{ 
              left: coords.x - 10, 
              top: coords.y - 10, 
              width: coords.width + 20, 
              height: coords.height + 20 
            }}
          />
        )}
      </div>
    </AnimatePresence>
  );
};

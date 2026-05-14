import React from 'react';
import { motion } from 'motion/react';

export const TypingIndicator8848: React.FC = () => {
  return (
    <div className="flex gap-1 px-4 py-2">
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="w-1.5 h-1.5 bg-amber-500 rounded-full"
      />
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        className="w-1.5 h-1.5 bg-amber-500 rounded-full"
      />
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
        className="w-1.5 h-1.5 bg-amber-500 rounded-full"
      />
    </div>
  );
};

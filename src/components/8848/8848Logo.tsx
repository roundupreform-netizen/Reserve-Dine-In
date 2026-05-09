import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface LogoProps {
  size?: number;
  animated?: boolean;
  glow?: boolean;
  pulse?: boolean;
  className?: string;
  state?: 'idle' | 'listening' | 'thinking' | 'warning' | 'success';
}

const Logo8848 = ({ 
  size = 40, 
  animated = true, 
  glow = true, 
  pulse = true,
  className,
  state = 'idle'
}: LogoProps) => {
  const [imgError, setImgError] = React.useState(false);

  const getGlowColor = () => {
    switch (state) {
      case 'listening': return 'rgba(16, 185, 129, 0.6)'; // Emerald
      case 'thinking': return 'rgba(245, 158, 11, 0.6)'; // Amber
      case 'warning': return 'rgba(239, 68, 68, 0.6)'; // Red
      case 'success': return 'rgba(59, 130, 246, 0.6)'; // Blue
      default: return 'rgba(139, 92, 246, 0.4)'; // Primary Violet-ish
    }
  };

  return (
    <div 
      className={cn("relative flex items-center justify-center select-none", className)}
      style={{ width: size, height: size }}
    >
      {/* Background Glow - Intensified */}
      {glow && (
        <motion.div
          animate={pulse ? {
            scale: [1, 1.25, 1],
            opacity: [0.4, 0.8, 0.4],
          } : {}}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-full blur-2xl"
          style={{ backgroundColor: getGlowColor() }}
        />
      )}

      {/* Animated Orbiting Ring */}
      {animated && (
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-20"
        >
          <motion.circle
            cx="50"
            cy="50"
            r="47"
            fill="none"
            stroke={getGlowColor()}
            strokeWidth="3"
            strokeDasharray="15, 85"
            animate={{
              strokeDashoffset: [0, -100],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "linear",
            }}
          />
        </svg>
      )}

      {/* Main Logo Container */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative z-10 w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-[#050507] border border-white/20 shadow-2xl shadow-purple-500/20"
      >
        {/* SVG Fallback (Always present but behind image) */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0c0c14] via-[#050508] to-[#140c1c] p-2">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="mountGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="60%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
              <filter id="neon">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            
            {/* Stars */}
            <circle cx="20" cy="30" r="0.5" fill="white" opacity="0.4" />
            <circle cx="80" cy="25" r="0.8" fill="white" opacity="0.3" />
            
            {/* Mountain Body (Stylized) */}
            <path 
              d="M10,82 L35,45 L45,55 L55,30 L90,82 Z" 
              fill="url(#mountGrad)" 
              stroke="white" 
              strokeWidth="0.5"
            />
            {/* Peaks Detail */}
            <path 
              d="M35,45 L40,65 L30,65 Z" 
              fill="rgba(0,0,0,0.1)"
            />
            
            {/* 8848 Neon Text */}
            <text 
              x="50" 
              y="74" 
              textAnchor="middle" 
              fontSize="22" 
              fontWeight="950" 
              fill="#00F2FF" 
              filter="url(#neon)"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.05em' }}
            >
              8848
            </text>
            
            {/* METERS Subtext */}
            <text 
              x="50" 
              y="86" 
              textAnchor="middle" 
              fontSize="7" 
              fontWeight="800" 
              fill="#94a3b8" 
              letterSpacing="3"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              METERS
            </text>

            {/* Grid/Radar lines for tactical feel */}
            <line x1="10" y1="82" x2="90" y2="82" stroke="rgba(255,255,255,0.2)" strokeWidth="0.3" />
          </svg>
        </div>

        {/* Real Image Overlay */}
        {!imgError && (
          <img 
            src="/8848_meters_logo.png" 
            alt="8848 Meters" 
            className="w-full h-full object-contain absolute inset-0 z-10"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        )}
      </motion.div>
    </div>
  );
};

export default Logo8848;

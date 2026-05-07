import React from 'react';
import { motion } from 'motion/react';
import { Utensils, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GlassCard, Button } from '../components/ui/core';

export default function AuthScreen() {
  const { signInWithGoogle, error } = useAuth();

  return (
    <div className="min-h-screen bg-[#0A0A0C] flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_20%_20%,_rgba(16,185,129,0.15)_0%,_transparent_40%),_radial-gradient(circle_at_80%_80%,_rgba(59,130,246,0.1)_0%,_transparent_40%)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0.8, rotate: 0 }}
          animate={{ scale: 1, rotate: 45 }}
          className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-[0_10px_40px_rgba(16,185,129,0.4)] mb-8 mx-auto"
        >
          <div className="w-10 h-10 border-2 border-white rounded-md -rotate-45 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </motion.div>
        
        <h1 className="text-5xl font-bold tracking-tighter text-white mb-2 italic">Reserve Dine In</h1>
        <p className="text-white/30 text-[10px] uppercase tracking-[0.4em] font-bold mb-12">Managed by Everest Developers</p>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-semibold max-w-sm mx-auto"
          >
            {error}
          </motion.div>
        )}

        <div className="w-full max-w-xs mx-auto">
          <Button 
            className="w-full h-16 bg-white text-black hover:bg-gray-100 shadow-[0_15px_35px_rgba(255,255,255,0.1)] border-none rounded-[1.25rem] text-sm font-bold"
            onClick={signInWithGoogle}
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Continue with Google
          </Button>
          
          <p className="text-[9px] text-white/10 uppercase tracking-[0.3em] font-bold mt-8">
            Enterprise Cloud Secure
          </p>
        </div>
      </motion.div>
    </div>
  );
}

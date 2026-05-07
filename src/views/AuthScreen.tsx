import React from 'react';
import { motion } from 'motion/react';
import { Utensils, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GlassCard, Button } from '../components/ui/core';

export default function AuthScreen() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_20%_20%,_rgba(16,185,129,0.15)_0%,_transparent_40%),_radial-gradient(circle_at_80%_80%,_rgba(59,130,246,0.1)_0%,_transparent_40%)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-12 text-center">
          <motion.div
            initial={{ scale: 0.8, rotate: 0 }}
            animate={{ scale: 1, rotate: 45 }}
            className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-[0_10px_40px_rgba(16,185,129,0.4)] mb-8"
          >
            <div className="w-10 h-10 border-2 border-white rounded-md -rotate-45 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </motion.div>
          <h1 className="text-5xl font-bold tracking-tighter text-white mb-2 italic">Reserve Dine In</h1>
          <p className="text-white/30 text-[10px] uppercase tracking-[0.4em] font-bold">Managed by Everest Developers</p>
        </div>

        <GlassCard className="text-center p-10 relative overflow-hidden rounded-[2.5rem] border-white/[0.05]">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-300 opacity-50" />
          <h2 className="text-xl font-bold mb-8 text-white tracking-tight">Modern Restaurant Management</h2>
          <div className="space-y-6">
            <Button 
              className="w-full h-16 bg-white text-black hover:bg-gray-100 shadow-[0_15px_35px_rgba(255,255,255,0.1)] border-none rounded-[1.25rem]"
              onClick={signInWithGoogle}
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Continue with Google
            </Button>
            <div className="pt-4 flex items-center justify-center gap-4">
              <div className="h-px w-8 bg-white/10" />
              <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
                Enterprise Cloud Secure
              </p>
              <div className="h-px w-8 bg-white/10" />
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

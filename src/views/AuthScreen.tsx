import React from 'react';
import { motion } from 'motion/react';
import { Utensils, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GlassCard, Button } from '../components/ui/core';
import Logo8848 from '../components/8848/8848Logo';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';

export default function AuthScreen() {
  const { login, error } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#1a0f0a] flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_20%_20%,_rgba(249,115,22,0.1)_0%,_transparent_40%),_radial-gradient(circle_at_80%_80%,_rgba(120,53,15,0.1)_0%,_transparent_40%)]">
      <div className="absolute top-8 right-8">
        <LanguageSwitcher />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center w-full max-w-md"
      >
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-orange-500 blur-3xl opacity-20 rounded-full animate-pulse" />
            <Utensils size={80} className="text-orange-500 relative z-10" />
          </div>
        </div>
        
        <h1 className="text-5xl font-black tracking-tighter text-stone-100 mb-2">Reserve Dine In</h1>
        <p className="text-orange-500/80 text-sm font-bold uppercase tracking-[0.3em] mb-4">Smart Reservations for Smart Restaurants</p>
        <p className="text-stone-500 text-[10px] uppercase tracking-[0.4em] font-bold mb-12">Everest Developers | Goa</p>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-semibold"
          >
            {error}
          </motion.div>
        )}

        <div className="w-full max-w-xs mx-auto space-y-4">
          <Button 
            className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white shadow-[0_15px_30px_rgba(249,115,22,0.3)] border-none text-sm font-black uppercase tracking-[0.2em] rounded-2xl transition-all"
            onClick={login}
          >
            <LogIn size={20} />
            Sign in with Google
          </Button>
          
          <p className="text-stone-500 text-[9px] uppercase tracking-[0.2em] font-bold">
            Authorized Personnel Only
          </p>
        </div>
      </motion.div>
    </div>
  );
}

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
    <div className="min-h-screen bg-[#0A0A0C] flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_20%_20%,_rgba(16,185,129,0.15)_0%,_transparent_40%),_radial-gradient(circle_at_80%_80%,_rgba(59,130,246,0.1)_0%,_transparent_40%)]">
      <div className="absolute top-8 right-8">
        <LanguageSwitcher />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Logo8848 
          size={120} 
          glow 
          pulse 
          animated 
          className="mx-auto mb-8"
        />
        
        <h1 className="text-5xl font-bold tracking-tighter text-white mb-2 italic">Reserve Dine In</h1>
        <p className="text-white/30 text-[10px] uppercase tracking-[0.4em] font-bold mb-12">{t('ai.poweredBy', 'Powered by 8848 Meters Intelligence')}</p>

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
            className="w-full h-16 bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_15px_35px_rgba(16,185,129,0.2)] border-none text-sm font-black uppercase tracking-[0.2em]"
            style={{ borderStyle: 'ridge', borderRadius: '25px', borderWidth: '20px' }}
            onClick={login}
          >
            <LogIn size={20} />
            {t('common.login', 'Secure Login')}
          </Button>
          
          <p 
            className="text-[9px] uppercase tracking-[0.3em] font-bold mt-8"
            style={{ textAlign: 'center', fontStyle: 'normal', textDecoration: 'none', fontWeight: 'normal', borderColor: '#010101', borderRadius: '1px', borderWidth: '1px', borderStyle: 'groove', backgroundColor: '#040500' }}
          >
            {t('common.internalAccess', 'Internal Management Access')}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Volume2, Languages, HelpCircle, StopCircle, Loader2 } from 'lucide-react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

import { speak, stopSpeaking, startListening, answerVoiceQuestion, VoiceLanguage } from '../services/voiceGuide';
import { guideScripts } from '../data/guideScripts';

interface VoiceGuideProps {
  screen: 'login' | 'dashboard' | 'newBooking' | 'tables' | 'reports';
  language: VoiceLanguage;
  onLanguageChange: (lang: VoiceLanguage) => void;
  isNewUser?: boolean;
}

const VoiceGuide: React.FC<VoiceGuideProps> = ({ 
  screen, 
  language, 
  onLanguageChange,
  isNewUser = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-start guide for new users
  useEffect(() => {
    if (isNewUser) {
      setTimeout(() => startGuide(), 1000);
    }
  }, [isNewUser]);

  // Stop speaking when screen changes or component unmounts
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [screen]);

  const startGuide = useCallback(() => {
    // 1. Speak the guide script
    const script = guideScripts[screen][language];
    speak(script, language);

    // 2. Start Driver.js tour
    const driverObj = driver({
      showProgress: true,
      animate: true,
      popoverClass: 'driverjs-theme',
      steps: getDriverSteps(screen)
    });

    driverObj.drive();
  }, [screen, language]);

  const getDriverSteps = (screenName: string) => {
    switch (screenName) {
      case 'dashboard':
        return [
          { element: '#todays-bookings', popover: { title: "Today's Bookings", description: "View all your reservations for today at a glance." } },
          { element: '#new-booking-btn', popover: { title: "Create New Booking", description: "Tap here to add a new reservation to the system." } },
          { element: '#table-grid', popover: { title: "Table Status", description: "Monitor which tables are available or occupied in real-time." } }
        ];
      case 'newBooking':
        return [
          { element: '#customer-name', popover: { title: "Customer Name", description: "Enter the name of the person making the reservation." } },
          { element: '#booking-date', popover: { title: "Select Date", description: "Choose the date for the reservation." } },
          { element: '#booking-time', popover: { title: "Select Time", description: "Choose the preferred time slot." } },
          { element: '#guest-count', popover: { title: "Guests", description: "How many people will be seated?" } },
          { element: '#confirm-btn', popover: { title: "Confirm", description: "Tap to save the booking and notify the team." } }
        ];
      case 'tables':
        return [
          { element: '#available-tables', popover: { title: "Available Tables", description: "These tables are ready for new customers." } },
          { element: '#occupied-tables', popover: { title: "Occupied Tables", description: "These tables currently have active guests." } }
        ];
      default:
        return [];
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      // Logic to stop manually if needed
      return;
    }

    setError(null);
    setAiResponse(null);
    setIsListening(true);

    startListening(
      async (text) => {
        setIsListening(false);
        setIsAnswering(true);
        const answer = await answerVoiceQuestion(text, screen, language);
        setAiResponse(answer);
        setIsAnswering(false);
      },
      (err) => {
        setError(err);
        setIsListening(false);
      },
      language
    );
  };

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-orange-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-orange-700 transition-transform hover:scale-110 z-50 animate-bounce-slow"
        title="Voice Help Guide"
      >
        <Mic size={24} />
      </button>

      {/* Help Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-80 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 bg-zinc-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Volume2 size={16} className="text-white" />
                </div>
                <span className="text-sm font-bold text-white uppercase tracking-wider">AI Guide</span>
              </div>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  stopSpeaking();
                }}
                className="text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Language Selector */}
            <div className="p-3 flex items-center justify-center gap-4 border-b border-zinc-800">
              <button 
                onClick={() => onLanguageChange('en-IN')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${language === 'en-IN' ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}
              >
                🇬🇧 ENG
              </button>
              <button 
                onClick={() => onLanguageChange('hi-IN')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${language === 'hi-IN' ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}
              >
                🇮🇳 HIN
              </button>
              <button 
                onClick={() => onLanguageChange('mr-IN')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${language === 'mr-IN' ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}
              >
                🟠 MAR
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <button 
                onClick={startGuide}
                className="w-full py-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-colors"
              >
                <HelpCircle size={18} className="text-orange-500" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">Start Voice Guide</span>
              </button>

              <div className="pt-4 border-t border-zinc-800">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 text-center">Ask a Question</p>
                
                <div className="flex flex-col items-center">
                  {isListening ? (
                    <button
                      onClick={() => setIsListening(false)}
                      className="group relative"
                    >
                      <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                      <div className="relative w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-600/30">
                        <StopCircle size={28} />
                      </div>
                      <span className="block mt-3 text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">Listening...</span>
                    </button>
                  ) : isAnswering ? (
                    <div className="flex flex-col items-center py-4">
                      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                      <span className="block mt-3 text-[10px] font-black text-orange-500 uppercase tracking-widest">Thinking...</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleMicClick}
                      className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-600/30 hover:scale-105 transition-transform"
                    >
                      <Mic size={28} />
                    </button>
                  )}
                </div>

                {error && (
                  <p className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-400 text-center font-medium">
                    {error}
                  </p>
                )}

                {aiResponse && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl"
                  >
                    <p className="text-[11px] text-orange-200 leading-relaxed italic">"{aiResponse}"</p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-zinc-800/30 flex items-center justify-center gap-2">
              <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em]">Built by Everest Developers</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .driverjs-theme {
          background-color: #18181b !important;
          color: #ffffff !important;
          border-radius: 16px !important;
          border: 1px solid #3f3f46 !important;
        }
        .driver-popover-title { color: #f97316 !important; font-weight: 800 !important; text-transform: uppercase !important; font-size: 14px !important; }
        .driver-popover-description { color: #a1a1aa !important; font-size: 12px !important; }
        .driver-popover-btn { background-color: #27272a !important; color: white !important; border: none !important; border-radius: 8px !important; text-shadow: none !important; }
        .driver-popover-next-btn { background-color: #f97316 !important; }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }
      `}} />
    </>
  );
};

export default VoiceGuide;

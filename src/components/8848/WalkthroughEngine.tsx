import React, { useState, useEffect } from 'react';
import { useAIStore } from '../../store/useAIStore';
import { use8848WalkthroughStore } from '../../store/8848/use8848WalkthroughStore';
import { walkthroughNarrator } from '../../voice/8848WalkthroughNarrator';
import { use8848LanguageStore } from '../../store/8848/use8848LanguageStore';
import Logo8848 from './8848Logo';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Volume2, SkipForward, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { voiceEngine } from '../../voice/8848VoiceEngine';

const tutorials = [
  {
    id: 'reservation_flow',
    title: 'Reservation Creation',
    steps: [
      {
        id: 'step1',
        targetId: 'new-reservation-btn',
        title: 'Tactical Entry',
        description: 'Initiate a new reservation.',
        narration: {
          en: 'Welcome. To start, click the New Reservation button to initiate tactical entry.',
          hi: 'नमस्ते। शुरू करने के लिए, न्यू रिजर्वेशन बटन पर क्लिक करें।',
          mr: 'नमस्कार. सुरू करण्यासाठी, न्यू रिझर्व्हेशन बटणावर क्लिक करा.',
          kok: 'Namaskar. Suru korpak, New Reservation buttonacher click korat.'
        },
        actionRequired: 'click' as const
      },
      {
        id: 'step2',
        targetId: 'guest-name-field',
        title: 'Unit Identification',
        description: 'Enter the guest name.',
        narration: {
          en: 'Great. Now, enter the guest name here to identify the unit.',
          hi: 'बहुत अच्छे। अब, यूनिट की पहचान करने के लिए यहां अतिथि का नाम दर्ज करें।',
          mr: 'उत्तम. आता, युनिट ओळखण्यासाठी पाहुण्याचे नाव प्रविष्ट करा.',
          kok: 'Mast. Ata, unit vollkok hanga guestache nav bhorat.'
        },
        actionRequired: 'input' as const
      }
    ]
  },
  {
    id: 'dashboard_intel',
    title: 'Dashboard Overview',
    steps: [
      {
        id: 'dash1',
        targetId: 'stats-summary',
        title: 'Intel Summary',
        description: 'View operation stats.',
        narration: {
          en: 'This is your Intel Summary. Monitor your real-time occupancy and pending units here.',
          hi: 'यह आपका इंटेल सारांश है। अपनी वास्तविक अधिभोग की निगरानी यहाँ करें।',
          mr: 'हे तुमचे बुद्धिमत्ता सारांश आहे. तुमचे रिअल-टाइम ऑक्युपन्सी येथे पहा.',
          kok: 'He tumche intel summary. Tumche real-time occupancy hanga polyeat.'
        },
        actionRequired: 'none' as const
      }
    ]
  }
];

const WalkthroughEngine = () => {
  const { messages } = useAIStore();
  const { 
    activeWalkthrough, 
    currentStepIndex, 
    isNarrationPlaying, 
    isWaitingForAction,
    startWalkthrough, 
    nextStep, 
    stopWalkthrough 
  } = use8848WalkthroughStore();
  
  const { selectedLanguage } = use8848LanguageStore();
  const { t } = useTranslation();
  const [showSelector, setShowSelector] = useState(false);

  // Trigger narration whenever step changes
  useEffect(() => {
    if (activeWalkthrough && currentStepIndex !== -1) {
      walkthroughNarrator.narrateStep();
    } else if (!activeWalkthrough) {
      walkthroughNarrator.stopAll();
    }
  }, [activeWalkthrough, currentStepIndex]);

  // Handle AI trigger
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const tutorialAction = lastMessage?.actions?.find((a: any) => a.type === 'startTutorial');
    
    if (tutorialAction) {
      const tut = tutorials.find(t => t.id === tutorialAction.params.name);
      if (tut) startWalkthrough(tut);
    }
  }, [messages]);

  const currentStep = activeWalkthrough?.steps[currentStepIndex];

  return (
    <>
      <AnimatePresence>
        {activeWalkthrough && currentStep && (
          <div className="fixed inset-0 z-[200] pointer-events-none">
            {/* Backdrop Dimming (Inverse spotlight) */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
              style={{
                maskImage: `radial-gradient(circle 120px at var(--spotlight-x, 50%) var(--spotlight-y, 50%), transparent 100%, black 100%)`,
                WebkitMaskImage: `radial-gradient(circle 120px at var(--spotlight-x, 50%) var(--spotlight-y, 50%), transparent 100%, black 100%)`,
              }}
            />

            {/* Narrator Panel */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-lg p-6 pointer-events-auto">
              <motion.div 
                initial={{ y: 50, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 50, opacity: 0, scale: 0.9 }}
                className="bg-[#0F0F12]/90 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-2xl overflow-hidden relative"
              >
                {/* Voice Pulse Gradient */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 opacity-0 transition-opacity duration-1000",
                  isNarrationPlaying && "opacity-100"
                )} />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Logo8848 size={40} glow animated pulse={isNarrationPlaying} />
                        {isNarrationPlaying && (
                          <div className="absolute -inset-2">
                            <div className="absolute inset-0 border-2 border-blue-500/30 rounded-full animate-ping" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Talking Guide</h4>
                        <h3 className="text-xl font-bold text-white tracking-tight">{currentStep.title}</h3>
                      </div>
                    </div>
                    <button 
                      onClick={stopWalkthrough}
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <X size={18} className="text-white/40" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-1 h-12 rounded-full",
                        isNarrationPlaying ? "bg-blue-500 animate-pulse" : "bg-white/10"
                      )} />
                      <p className="text-lg text-white/80 font-medium leading-relaxed">
                        {currentStep.narration[selectedLanguage as keyof typeof currentStep.narration] || currentStep.narration.en}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {activeWalkthrough.steps.map((_, i) => (
                            <div 
                              key={i} 
                              className={cn(
                                "h-1 rounded-full transition-all duration-500",
                                i === currentStepIndex ? "w-8 bg-blue-500" : "w-2 bg-white/10"
                              )} 
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">
                          Step {currentStepIndex + 1} of {activeWalkthrough.steps.length}
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <button 
                          onClick={() => voiceEngine.stop()}
                          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                        >
                          <Volume2 size={12} />
                          Mute
                        </button>
                        <button 
                          onClick={nextStep}
                          className="px-6 py-2 rounded-xl bg-blue-600 text-[10px] font-black text-white uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
                        >
                          {currentStepIndex === activeWalkthrough.steps.length - 1 ? 'Finish' : 'Next'}
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Selection Overlay */}
      <AnimatePresence>
        {showSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-full max-w-xl bg-[#0F0F12] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Play size={24} fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">AI Training Modules</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Select a guided walkthrough</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSelector(false)} 
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X size={20} className="text-white/40" />
                </button>
              </div>

              <div className="p-8 grid grid-cols-1 gap-3">
                {tutorials.map((tut) => (
                  <button
                    key={tut.id}
                    onClick={() => {
                      startWalkthrough(tut);
                      setShowSelector(false);
                    }}
                    className="group relative p-6 bg-white/[0.03] border border-white/5 rounded-3xl hover:bg-white/[0.06] hover:border-blue-500/30 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                        <CheckCircle2 size={20} />
                      </div>
                      <div className="text-left">
                        <span className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight">{tut.title}</span>
                        <p className="text-[10px] text-white/20 uppercase tracking-widest font-black mt-1">{tut.steps.length} Automated Steps</p>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-500 transition-all group-hover:translate-x-2">
                      <ChevronRight size={18} className="text-white/40 group-hover:text-white" />
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="p-6 bg-white/[0.01] flex items-center justify-center gap-2 border-t border-white/5">
                <Volume2 size={12} className="text-blue-500/40" />
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Narration System Active</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Styles for dynamic highlighting pulsars */}
      <style dangerouslySetInnerHTML={{ __html: `
        .highlight-pulse-8848 {
          position: relative !important;
          z-index: 250 !important;
          pointer-events: auto !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.4) !important;
          animation: pulse-glow-8848 2s infinite !important;
          transition: all 0.3s ease !important;
        }

        @keyframes pulse-glow-8848 {
          0% { box-shadow: 0 0 0 0px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0), 0 0 40px rgba(59, 130, 246, 0.6); }
          100% { box-shadow: 0 0 0 0px rgba(59, 130, 246, 0), 0 0 20px rgba(59, 130, 246, 0.4); }
        }
      `}} />

      <TutorialListener onShowSelector={() => setShowSelector(true)} />
    </>
  );
};

const TutorialListener = ({ onShowSelector }: { onShowSelector: () => void }) => {
  useEffect(() => {
    const handleTrigger = () => onShowSelector();
    window.addEventListener('8848-show-walkthroughs', handleTrigger);
    return () => window.removeEventListener('8848-show-walkthroughs', handleTrigger);
  }, [onShowSelector]);
  return null;
};

export default WalkthroughEngine;

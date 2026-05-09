import React, { useState, useEffect } from 'react';
import * as JoyrideModule from 'react-joyride';
const Joyride = (JoyrideModule as any).Joyride || (JoyrideModule as any).default || JoyrideModule;
import { Step, STATUS } from 'react-joyride';
import { useAIStore } from '../../store/useAIStore';
import { use8848Walkthrough } from '../../store/8848/use8848Walkthrough';
import Logo8848 from './8848Logo';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play } from 'lucide-react';

const WalkthroughEngine = () => {
  const { messages } = useAIStore();
  const { isActive, currentTutorial, stopTutorial, startTutorial } = use8848Walkthrough();
  const { t } = useTranslation();
  const [showSelector, setShowSelector] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  const tutorials: Record<string, { title: string; steps: Step[] }> = {
    reservation_flow: {
      title: t('tutorial.reservations.title', 'Reservation Flow'),
      steps: [
        {
          target: '[data-tour="new-reservation-btn"]',
          content: t('tutorial.reservations.start', "This is where tactical operations begin. Click here to initiate a new reservation."),
          placement: 'bottom' as const,
        },
        {
          target: '[data-tour="customer-search"]',
          content: t('tutorial.reservations.customer', "Search for existing patrons or enter a new target's coordinates (details)."),
        },
        {
          target: '[data-tour="table-selection"]',
          content: t('tutorial.reservations.tables', "Allocate a specific tactical zone (table) for this unit."),
        }
      ]
    },
    dashboard_intel: {
      title: t('tutorial.dashboard.title', 'Dashboard Intel'),
      steps: [
        {
          target: '[data-tour="stats-card"]',
          content: t('tutorial.dashboard.stats', "Daily intelligence summary. Monitor your seated vs pending units."),
        },
        {
          target: '[data-tour="occupancy-chart"]',
          content: t('tutorial.dashboard.occupancy', "Real-time occupancy metrics for strategic planning."),
        }
      ]
    },
    menu_management: {
      title: t('tutorial.menu.title', 'Menu Intelligence'),
      steps: [
        {
          target: '[data-tour="menu-upload"]',
          content: t('tutorial.menu.upload', "Upload tactical menu documents (PDF/JPG) for AI parsing."),
        }
      ]
    }
  };

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const tutorialAction = lastMessage?.actions?.find((a: any) => a.type === 'startTutorial');
    
    if (tutorialAction && tutorials[tutorialAction.params.name]) {
      setSteps(tutorials[tutorialAction.params.name].steps);
      startTutorial(tutorialAction.params.name);
    }
  }, [messages]);

  useEffect(() => {
    if (currentTutorial && tutorials[currentTutorial]) {
      setSteps(tutorials[currentTutorial].steps);
    }
  }, [currentTutorial]);

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      stopTutorial();
    }
  };

  return (
    <>
      <Joyride
        steps={steps}
        run={isActive}
        continuous
        scrollToFirstStep
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        beaconComponent={() => (
          <Logo8848 size={32} glow pulse animated className="cursor-pointer" />
        )}
        styles={{
          options: {
            primaryColor: '#f59e0b',
            backgroundColor: '#0F0F12',
            textColor: '#fff',
            arrowColor: '#0F0F12',
            zIndex: 1000,
          },
          buttonNext: {
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 'black',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            padding: '10px 20px',
            backgroundColor: '#f59e0b',
          },
          buttonBack: {
            fontSize: 12,
            color: 'rgba(255,255,255,0.4)',
            marginRight: 10,
          },
          buttonSkip: {
            fontSize: 12,
            color: 'rgba(255,255,255,0.4)',
          }
        }}
      />

      {/* Manual Tutorial Selector Component (can be triggered from AI panel) */}
      <AnimatePresence>
        {showSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-[#0F0F12] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-white font-black uppercase tracking-tight">{t('ai.walkthrough')}</h3>
                <button onClick={() => setShowSelector(false)} className="text-white/40 hover:text-white"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-3">
                {Object.entries(tutorials).map(([id, tut]) => (
                  <button
                    key={id}
                    onClick={() => {
                      startTutorial(id);
                      setShowSelector(false);
                    }}
                    className="w-full p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/10 hover:border-blue-500/30 transition-all flex items-center justify-between group"
                  >
                    <span className="text-sm font-bold text-white group-hover:text-blue-400">{tut.title}</span>
                    <Play size={16} className="text-white/20 group-hover:text-blue-500" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global listener for manual activation from AIChatPanel */}
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

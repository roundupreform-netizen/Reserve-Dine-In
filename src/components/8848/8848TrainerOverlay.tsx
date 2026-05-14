import React from 'react';
import { ScreenHighlight8848 } from './8848ScreenHighlight';
import { GuidePanel8848 } from './8848GuidePanel';
import { VoiceGuide8848 } from './8848VoiceGuide';
import { RealtimePointer8848 } from './8848RealtimePointer';
import { use8848TrainerStore } from '../../store/8848/use8848TrainerStore';

export const TrainerOverlay8848: React.FC = () => {
  const { isActive } = use8848TrainerStore();

  if (!isActive) return null;

  return (
    <>
      <ScreenHighlight8848 />
      <GuidePanel8848 />
      <VoiceGuide8848 />
      <RealtimePointer8848 />
      
      {/* Global trainer-specific styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .trainer-mode-active {
          cursor: crosshair !important;
        }
        
        [data-tactical="true"] {
          position: relative;
        }

        /* Prevent clicks on background if in spotlight mode */
        .trainer-spotlight-active .app-content {
          pointer-events: none;
        }
        .trainer-spotlight-active .highlight-pulse-8848 {
          pointer-events: auto;
          z-index: 250;
        }
      `}} />
    </>
  );
};

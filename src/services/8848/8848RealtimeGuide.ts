import { actionEngine, UIAction, navigationEngine } from './8848ActionEngine';
import { walkthroughNarrator } from '../../voice/8848WalkthroughNarrator';
import { use8848LanguageStore } from '../../store/8848/use8848LanguageStore';
import { use8848TrainerStore } from '../../store/8848/use8848TrainerStore';
import { use8848VoiceStore } from '../../store/8848/use8848VoiceStore';
import { voiceRecognition } from './8848SpeechRecognition';
import { use8848WorkflowStore } from '../../store/8848/use8848WorkflowStore';

export class RealtimeGuide8848 {
  private static instance: RealtimeGuide8848;

  private constructor() {}

  public static getInstance(): RealtimeGuide8848 {
    if (!RealtimeGuide8848.instance) {
      RealtimeGuide8848.instance = new RealtimeGuide8848();
    }
    return RealtimeGuide8848.instance;
  }

  public async initiateActionFlow(actions: UIAction[], narration?: string) {
    const { selectedLanguage } = use8848LanguageStore.getState();
    const trainerStore = use8848TrainerStore.getState();
    const voiceStore = use8848VoiceStore.getState();

    // Pause listening while speaking to avoid feedback or self-transcription
    voiceRecognition.stop();
    voiceStore.setState('guiding');

    // 1. Speak (Narration)
    if (narration) {
      trainerStore.setSuggestion(narration);
      await walkthroughNarrator.narrate(narration, selectedLanguage);
    }

    // 2. Execute Actions Sequentially
    for (const action of actions) {
      await actionEngine.execute(action);
      
      // If it's a click wait, we don't delay, let the user act
      if (action.type !== 'waitForClick') {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    voiceStore.setState('idle');
    // Resume listening after guidance completes if trainer still active
    if (trainerStore.isActive) {
      voiceRecognition.start();
    }
  }

  public async startWorkflow(workflowId: string, steps: string[]) {
    const workflowStore = use8848WorkflowStore.getState();
    workflowStore.startWorkflow(workflowId, steps);
    
    // Proactively guide the first step
    this.initiateActionFlow([], `Starting training for ${workflowId}. Let's begin with the first step.`);
  }
}

export const realtimeGuide = RealtimeGuide8848.getInstance();


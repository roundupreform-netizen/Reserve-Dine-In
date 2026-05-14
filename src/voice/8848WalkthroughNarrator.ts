import { voiceEngine } from './8848VoiceEngine';
import { use8848WalkthroughStore } from '../store/8848/use8848WalkthroughStore';
import { use8848LanguageStore } from '../store/8848/use8848LanguageStore';

class WalkthroughNarrator8848 {
  private static instance: WalkthroughNarrator8848;
  private interactionAborts: AbortController[] = [];

  private constructor() {}

  public static getInstance(): WalkthroughNarrator8848 {
    if (!WalkthroughNarrator8848.instance) {
      WalkthroughNarrator8848.instance = new WalkthroughNarrator8848();
    }
    return WalkthroughNarrator8848.instance;
  }

  public async narrateStep() {
    const { activeWalkthrough, currentStepIndex, setNarrationPlaying, setWaitingForAction, nextStep, stopWalkthrough } = use8848WalkthroughStore.getState();
    const { selectedLanguage } = use8848LanguageStore.getState();

    if (!activeWalkthrough || currentStepIndex === -1) return;

    const step = activeWalkthrough.steps[currentStepIndex];
    if (!step) {
      stopWalkthrough();
      return;
    }

    const lang = (selectedLanguage || 'en') as keyof typeof step.narration;
    const text = step.narration[lang] || step.narration.en;

    setNarrationPlaying(true);
    
    voiceEngine.speak(text, lang, () => {
      setNarrationPlaying(false);
      
      if (step.actionRequired === 'click') {
        this.waitForClickInteraction(step.targetId);
      } else if (step.actionRequired === 'none') {
        // Auto-advance if no action required
        setTimeout(() => nextStep(), 2000);
      } else {
        setWaitingForAction(true);
      }
    });

    // Highlight the target element visually (this would be handled by the UI layer, 
    // but we ensure it's scrolled into view here)
    const element = document.getElementById(step.targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-pulse-8848');
    }
  }

  public async narrate(text: string, lang: string): Promise<void> {
    return new Promise((resolve) => {
      use8848WalkthroughStore.getState().setNarrationPlaying(true);
      voiceEngine.speak(text, lang, () => {
        use8848WalkthroughStore.getState().setNarrationPlaying(false);
        resolve();
      });
    });
  }

  private waitForClickInteraction(targetId: string) {
    const element = document.getElementById(targetId);
    if (!element) {
      use8848WalkthroughStore.getState().nextStep();
      return;
    }

    const { setWaitingForAction, nextStep } = use8848WalkthroughStore.getState();
    setWaitingForAction(true);

    const controller = new AbortController();
    this.interactionAborts.push(controller);

    element.addEventListener('click', () => {
      element.classList.remove('highlight-pulse-8848');
      controller.abort();
      nextStep();
    }, { once: true, signal: controller.signal });
  }

  public stopAll() {
    voiceEngine.stop();
    this.interactionAborts.forEach(a => a.abort());
    this.interactionAborts = [];
  }
}

export const walkthroughNarrator = WalkthroughNarrator8848.getInstance();

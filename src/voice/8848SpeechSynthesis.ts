import { use8848VoiceStore } from '../store/8848/use8848VoiceStore';

export class SpeechSynthesis8848 {
  private static instance: SpeechSynthesis8848;
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  private constructor() {
    this.synthesis = window.speechSynthesis;
  }

  public static getInstance(): SpeechSynthesis8848 {
    if (!SpeechSynthesis8848.instance) {
      SpeechSynthesis8848.instance = new SpeechSynthesis8848();
    }
    return SpeechSynthesis8848.instance;
  }

  public speak(text: string, lang: string = 'en-US', onEnd?: () => void) {
    this.stop();

    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.lang = this.getLangCode(lang);
    this.currentUtterance.rate = 1.0;
    this.currentUtterance.pitch = 1.0;
    this.currentUtterance.volume = 1.0;

    this.currentUtterance.onstart = () => {
      use8848VoiceStore.getState().setState('speaking');
    };

    this.currentUtterance.onend = () => {
      this.currentUtterance = null;
      if (use8848VoiceStore.getState().isContinuous) {
        use8848VoiceStore.getState().setState('listening');
      } else {
        use8848VoiceStore.getState().setState('idle');
      }
      if (onEnd) onEnd();
    };

    this.currentUtterance.onerror = (event) => {
      console.error('Speech Synthesis Error:', event);
      this.currentUtterance = null;
      use8848VoiceStore.getState().setState('idle');
    };

    this.synthesis.speak(this.currentUtterance);
  }

  public stop() {
    this.synthesis.cancel();
    this.currentUtterance = null;
  }

  private getLangCode(lang: string): string {
    switch (lang) {
      case 'hi': return 'hi-IN';
      case 'mr': return 'mr-IN';
      case 'kok': return 'hi-IN';
      default: return 'en-US';
    }
  }
}

export const speechSynthesis = SpeechSynthesis8848.getInstance();

import { VoiceLanguage } from '../services/voiceGuide';

class VoiceEngine8848 {
  private static instance: VoiceEngine8848;
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  private constructor() {
    this.synthesis = window.speechSynthesis;
  }

  public static getInstance(): VoiceEngine8848 {
    if (!VoiceEngine8848.instance) {
      VoiceEngine8848.instance = new VoiceEngine8848();
    }
    return VoiceEngine8848.instance;
  }

  public speak(text: string, lang: string = 'en-IN', onEnd?: () => void) {
    this.stop();

    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.lang = this.getLangCode(lang);
    this.currentUtterance.rate = 0.95;
    this.currentUtterance.pitch = 1.0;
    this.currentUtterance.volume = 1.0;

    this.currentUtterance.onend = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    this.synthesis.speak(this.currentUtterance);
  }

  public stop() {
    this.synthesis.cancel();
    this.currentUtterance = null;
  }

  public isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  private getLangCode(lang: string): string {
    switch (lang) {
      case 'hi': return 'hi-IN';
      case 'kok': return 'hi-IN'; // Fallback to Hindi for Konkani if specific voice not available
      case 'mr': return 'mr-IN';
      case 'en': return 'en-IN';
      default: return lang;
    }
  }
}

export const voiceEngine = VoiceEngine8848.getInstance();

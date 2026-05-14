import { use8848VoiceStore } from '../store/8848/use8848VoiceStore';
import { use8848LanguageStore } from '../store/8848/use8848LanguageStore';
import toast from 'react-hot-toast';

export class SpeechRecognition8848 {
  private static instance: SpeechRecognition8848;
  private recognition: any = null;
  private onResultCallback: ((text: string) => void) | null = null;
  private isListening: boolean = false;

  private constructor() {
    this.init();
  }

  public static getInstance(): SpeechRecognition8848 {
    if (!SpeechRecognition8848.instance) {
      SpeechRecognition8848.instance = new SpeechRecognition8848();
    }
    return SpeechRecognition8848.instance;
  }

  private init() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech Recognition not supported in this browser.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onstart = () => {
      this.isListening = true;
      use8848VoiceStore.getState().setState('listening');
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript || interimTranscript) {
        use8848VoiceStore.getState().setTranscript(finalTranscript || interimTranscript);
      }

      if (finalTranscript && this.onResultCallback) {
        this.onResultCallback(finalTranscript.trim());
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech Recognition Error:', event.error);
      let errorMsg = 'Speech Recognition Error';
      
      if (event.error === 'not-allowed') {
        errorMsg = 'Microphone access denied. Please enable it in browser settings.';
      } else if (event.error === 'service-not-allowed') {
        errorMsg = 'Speech recognition service not allowed.';
      } else if (event.error === 'network') {
        errorMsg = 'Network error during speech recognition.';
      }

      use8848VoiceStore.getState().setError(errorMsg);
      toast.error(errorMsg);
      this.stop();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      const { isContinuous } = use8848VoiceStore.getState();
      if (isContinuous) {
        this.recognition.start();
      } else {
        use8848VoiceStore.getState().setState('idle');
      }
    };
  }

  public start(onResult: (text: string) => void) {
    if (!this.recognition) return;
    this.onResultCallback = onResult;
    const { selectedLanguage } = use8848LanguageStore.getState();
    this.recognition.lang = this.getLangCode(selectedLanguage);
    
    use8848VoiceStore.getState().setContinuous(true);
    try {
      this.recognition.start();
    } catch (e) {
      // Already running
    }
  }

  public stop() {
    if (!this.recognition) return;
    use8848VoiceStore.getState().setContinuous(false);
    this.recognition.stop();
    this.isListening = false;
    use8848VoiceStore.getState().setState('idle');
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

export const speechRecognition = SpeechRecognition8848.getInstance();

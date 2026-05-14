import { use8848VoiceStore } from '../../store/8848/use8848VoiceStore';
import { use8848LanguageStore } from '../../store/8848/use8848LanguageStore';

export class VoiceRecognition8848 {
  private recognition: any = null;
  private isListening = false;
  private static instance: VoiceRecognition8848;

  private constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      
      this.recognition.onstart = () => {
        this.isListening = true;
        use8848VoiceStore.getState().setState('listening');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        const state = use8848VoiceStore.getState().state;
        if (state === 'listening') {
          use8848VoiceStore.getState().setState('idle');
        }
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

        if (finalTranscript) {
          use8848VoiceStore.getState().setTranscript(finalTranscript);
          // Broadcast for the Trainer Engine to process
          window.dispatchEvent(new CustomEvent('8848-speech-complete', { detail: { transcript: finalTranscript } }));
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('8848 Speech Error:', event.error);
        this.stop();
      };
    }
  }

  public static getInstance(): VoiceRecognition8848 {
    if (!VoiceRecognition8848.instance) {
      VoiceRecognition8848.instance = new VoiceRecognition8848();
    }
    return VoiceRecognition8848.instance;
  }

  public start() {
    if (!this.recognition || this.isListening) return;
    
    const { selectedLanguage } = use8848LanguageStore.getState();
    // Map internal language codes to BCP-47
    const langMap: Record<string, string> = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'mr': 'mr-IN',
      'kok': 'mr-IN' // Konkani mapping to Marathi-ish or specific if browser supports
    };
    
    this.recognition.lang = langMap[selectedLanguage] || 'en-US';
    try {
      this.recognition.start();
    } catch (e) {
      console.error('Failed to start recognition', e);
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }
}

export const voiceRecognition = VoiceRecognition8848.getInstance();

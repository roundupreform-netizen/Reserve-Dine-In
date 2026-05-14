import { speechRecognition } from './8848SpeechRecognition';
import { speechSynthesis } from './8848SpeechSynthesis';
import { conversationEngine } from './8848ConversationEngine';
import { use8848VoiceStore } from '../store/8848/use8848VoiceStore';

export class RealtimeVoice8848 {
  private static instance: RealtimeVoice8848;

  private constructor() {}

  public static getInstance(): RealtimeVoice8848 {
    if (!RealtimeVoice8848.instance) {
      RealtimeVoice8848.instance = new RealtimeVoice8848();
    }
    return RealtimeVoice8848.instance;
  }

  public toggleVoiceAgent() {
    const { state } = use8848VoiceStore.getState();
    
    if (state === 'listening' || state === 'speaking' || state === 'thinking') {
      this.shutdown();
    } else {
      this.activate();
    }
  }

  public activate() {
    conversationEngine.startVoiceSupport();
  }

  public shutdown() {
    conversationEngine.stopVoiceSupport();
  }

  /**
   * Called when user clicks the mic button. 
   * If AI is speaking, it interrupts and starts listening.
   */
  public handleMicClick() {
    const { state } = use8848VoiceStore.getState();
    
    if (state === 'speaking') {
      speechSynthesis.stop();
      // Store state ensures it goes back to listening if continuous is true
    } else if (state === 'listening') {
      this.shutdown();
    } else {
      this.activate();
    }
  }
}

export const realtimeVoice = RealtimeVoice8848.getInstance();

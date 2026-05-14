import { speechRecognition } from './8848SpeechRecognition';
import { speechSynthesis } from './8848SpeechSynthesis';
import { trainerEngine } from '../services/8848/8848TrainerEngine';
import { use8848VoiceStore } from '../store/8848/use8848VoiceStore';
import { use8848TrainerStore } from '../store/8848/use8848TrainerStore';
import { use8848LanguageStore } from '../store/8848/use8848LanguageStore';

export class ConversationEngine8848 {
  private static instance: ConversationEngine8848;

  private constructor() {}

  public static getInstance(): ConversationEngine8848 {
    if (!ConversationEngine8848.instance) {
      ConversationEngine8848.instance = new ConversationEngine8848();
    }
    return ConversationEngine8848.instance;
  }

  public async startVoiceSupport() {
    // 1. Activate UI Trainer Mode
    trainerEngine.startTrainer();
    
    // 2. Start Listening
    speechRecognition.start(async (userText) => {
      await this.handleTurn(userText);
    });

    // 3. Initial Greeting
    const { selectedLanguage } = use8848LanguageStore.getState();
    const greeting = this.getGreeting(selectedLanguage);
    
    use8848TrainerStore.getState().setSuggestion(greeting);
    speechSynthesis.speak(greeting, selectedLanguage);
  }

  public stopVoiceSupport() {
    speechRecognition.stop();
    speechSynthesis.stop();
    trainerEngine.stopTrainer();
    use8848VoiceStore.getState().resetVoice();
  }

  private async handleTurn(userText: string) {
    if (!userText.trim()) return;

    // AI is thinking
    use8848VoiceStore.getState().setState('thinking');
    
    // Delegate to Trainer Engine which has full Context Vision + Gemini
    await trainerEngine.handleUserQuestion(userText);
  }

  private getGreeting(lang: string): string {
    switch (lang) {
      case 'hi': return "नमस्ते। मैं आपका 8848 AI ट्रेनर हूँ। आपको क्या समस्या आ रही है?";
      case 'mr': return "नमस्कार. मी तुमचा 8848 AI ट्रेनर आहे. तुम्हाला काय अडचण येत आहे?";
      case 'kok': return "नमस्कार. हांव तुमचो 8848 AI ट्रेनर. तुमकां कितें त्रास जाता?";
      default: return "Hello. I am your 8848 AI Trainer. What operational problem are you facing today? I will guide you step-by-step.";
    }
  }
}

export const conversationEngine = ConversationEngine8848.getInstance();

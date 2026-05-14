import { contextVision } from './8848ContextVision';
import { speechSynthesis } from '../../voice/8848SpeechSynthesis';
import { use8848TrainerStore } from '../../store/8848/use8848TrainerStore';
import { use8848LanguageStore } from '../../store/8848/use8848LanguageStore';

export class RealtimeAssistant8848 {
  private static instance: RealtimeAssistant8848;
  private lastCapturedState: string = '';

  private constructor() {}

  public static getInstance(): RealtimeAssistant8848 {
    if (!RealtimeAssistant8848.instance) {
      RealtimeAssistant8848.instance = new RealtimeAssistant8848();
    }
    return RealtimeAssistant8848.instance;
  }

  /**
   * Proactive guidance: checks if the screen state changed significantly
   * and offers a new tactical tip if the user seems lost.
   */
  public async monitorProgress() {
    const context = contextVision.getCapture();
    const currentStateStr = `${context.currentPage}-${context.activeModal}`;
    
    if (currentStateStr !== this.lastCapturedState) {
      this.lastCapturedState = currentStateStr;
      
      // Auto-analyze next step
      const analysis = await contextVision.analyzeState(context);
      if (analysis.suggestion && use8848TrainerStore.getState().isActive) {
        use8848TrainerStore.getState().setSuggestion(analysis.suggestion, analysis.targetId, analysis.highlight);
        // We don't speak automatically unless it's a major shift or user is in "Active Training"
      }
    }
  }

  public speakCurrentContext() {
    const context = contextVision.getCapture();
    const { selectedLanguage } = use8848LanguageStore.getState();
    let message = `You are currently on the ${context.currentPage} screen. `;
    if (context.activeModal) {
      message += `The ${context.activeModal} form is active. `;
    }
    
    speechSynthesis.speak(message, selectedLanguage);
  }
}


export const realtimeAssistant = RealtimeAssistant8848.getInstance();

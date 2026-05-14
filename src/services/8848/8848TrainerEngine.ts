import { contextVision } from './8848ContextVision';
import { use8848TrainerStore } from '../../store/8848/use8848TrainerStore';
import { use8848VoiceStore } from '../../store/8848/use8848VoiceStore';
import { aiQueue } from './8848AIQueue';
import { use8848LanguageStore } from '../../store/8848/use8848LanguageStore';
import { findLocalResponse } from '../../ai/localFallback/localResponses';
import { voiceRecognition } from './8848SpeechRecognition';

import { highlightEngine } from './8848HighlightEngine';

import { use8848ConversationStore } from '../../store/8848/use8848ConversationStore';

export class TrainerEngine8848 {
  private static instance: TrainerEngine8848;

  private constructor() {
    // Listen for speech completion
    window.addEventListener('8848-speech-complete', (e: any) => {
      const { isActive } = use8848TrainerStore.getState();
      const { addMessage } = use8848ConversationStore.getState();
      
      if (isActive) {
        addMessage('user', e.detail.transcript, 'voice');
        this.handleUserQuestion(e.detail.transcript);
      }
    });

    // Handle user interaction detection for workflow progression
    window.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (use8848TrainerStore.getState().isActive) {
        const id = target.id || target.getAttribute('data-8848-id');
        if (id) {
          console.log('8848 Trainer detected interaction with:', id);
          // Optional: AI could proactively comment on this action
        }
      }
    });
  }

  public static getInstance(): TrainerEngine8848 {
    if (!TrainerEngine8848.instance) {
      TrainerEngine8848.instance = new TrainerEngine8848();
    }
    return TrainerEngine8848.instance;
  }

  public async startTrainer() {
    const store = use8848TrainerStore.getState();
    const { selectedLanguage } = use8848LanguageStore.getState();
    const context = contextVision.getCapture();
    
    store.toggleTrainer(true);
    voiceRecognition.start(); // Start listening
    
    // Initial active guidance upon activation
    const initialPrompt = `ACTIVATION PROTOCOL: The user just clicked the AI Trainer button manually. 
      Identify that they are on the "${context.currentPage}" screen. 
      Greet them warmly, explain your role as their virtual trainer, and ask what task they need help with.
      Provide ONE direct tip for the current screen.
      
      CONTEXT: Page: ${context.currentPage}, Elements: ${context.visibleElements.join(', ')}.
      
      RESPOND: JSON { "content": "Narrative greeting + tip", "actions": [{"type": "pulse", "params": {"selector": "#ai-trainer-btn"}}] }`;

    try {
      const response = await aiQueue.request(initialPrompt);
      const advice = response.content;
      const actions = response.actions || [];
      
      store.setSuggestion(advice);
      use8848ConversationStore.getState().addMessage('assistant', advice);
      use8848ConversationStore.getState().setIsOpen(true);
      
      const { realtimeGuide } = await import('./8848RealtimeGuide');
      await realtimeGuide.initiateActionFlow(actions, advice);
    } catch (error) {
      const fallback = "Hello! I am your 8848 Virtual Trainer. I noticed you are in the " + context.currentPage + " section. How can I help you complete your tasks today?";
      store.setSuggestion(fallback);
      const { walkthroughNarrator } = await import('../../voice/8848WalkthroughNarrator');
      walkthroughNarrator.narrate(fallback, selectedLanguage);
    }
  }

  public stopTrainer() {
    const store = use8848TrainerStore.getState();
    store.toggleTrainer(false);
    voiceRecognition.stop(); // Stop listening
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    // Clear all highlights
    highlightEngine.clear();
    
    // Optional: Hide chat window but keep history if preferred
    // use8848ConversationStore.getState().setIsOpen(false);
  }

  public async handleUserQuestion(question: string) {
    const context = contextVision.getCapture();
    const trainerStore = use8848TrainerStore.getState();
    const voiceStore = use8848VoiceStore.getState();
    const { selectedLanguage } = use8848LanguageStore.getState();
    
    if (!trainerStore.isActive) return;

    voiceStore.setState('thinking');

    // 2. Build Tactical Prompt based on "General Guidance Protocol"
    const prompt = `TRAINER-GOAL: Guide user step-by-step through a task.
      
      PROTOCOL:
      1. IDENTIFY TASK: Based on user message "${question}", identify the task goal.
      2. BREAKDOWN: Provide clearly numbered steps.
      3. VISUAL ACTION: For each step, use "highlight", "pulse", or "spotlight" on the target button/field.
      4. CONFIRMATION: Tell them what to expect after clicking.
      5. PROGRESSION: If they ask for help with a specific section, NAVIGATE them there first.
      
      CONTEXT: Page: ${context.currentPage}, Modal: ${context.activeModal}, Elements: ${context.visibleElements.join(', ')}.
      
      USER MESSAGE: "${question}"
      
      RESPOND: JSON { "content": "Narrative step-by-step guidance", "actions": [{"type": "navigate|highlight|pulse|scroll|spotlight|waitForClick", "params": {...}}] }`;

    try {
      const response = await aiQueue.request(prompt);
      
      const advice = response.content;
      const actions = response.actions || [];
      const isLocal = response.mode === 'local' || response.mode === 'local-fallback' || response.mode === 'error-fallback';
      
      voiceStore.setLocal(isLocal);
      trainerStore.setSuggestion(advice);
      use8848ConversationStore.getState().addMessage('assistant', advice);

      // Execute Workflow Actions
      const { realtimeGuide } = await import('./8848RealtimeGuide');
      await realtimeGuide.initiateActionFlow(actions, advice);
      
    } catch (error) {
      console.error("Trainer Error:", error);
      voiceStore.setLocal(true);
      const localAdvice = findLocalResponse(question) || "Tactical bypass active. Proceed with the current workflow link.";
      trainerStore.setSuggestion(localAdvice);
      const { walkthroughNarrator } = await import('../../voice/8848WalkthroughNarrator');
      walkthroughNarrator.narrate(localAdvice, selectedLanguage);
    } finally {
      if (voiceStore.state === 'thinking') {
        voiceStore.setState('idle');
      }
    }
  }
}

export const trainerEngine = TrainerEngine8848.getInstance();


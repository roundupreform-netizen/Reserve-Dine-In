import { useAIStore } from '../../store/useAIStore';

export interface ScreenContext {
  currentPage: string;
  activeModal: string | null;
  visibleElements: string[];
  workflowState: any;
  hasErrors: boolean;
  currentLanguage: string;
}

export class ContextVision8848 {
  private static instance: ContextVision8848;

  private constructor() {}

  public static getInstance(): ContextVision8848 {
    if (!ContextVision8848.instance) {
      ContextVision8848.instance = new ContextVision8848();
    }
    return ContextVision8848.instance;
  }

  public getCapture(): ScreenContext {
    // This extracts real-time state from the app's global stores
    const aiContext = useAIStore.getState().context;
    
    // Scan DOM for specific tactical markers with more detail
    const interactiveElements = Array.from(document.querySelectorAll('button, input, select, [data-8848-id]'))
      .map(el => {
        const id = el.id || el.getAttribute('data-8848-id') || el.getAttribute('name') || '';
        const text = el.textContent?.trim() || (el as HTMLInputElement).placeholder || (el as HTMLInputElement).value || '';
        return id ? { id, text: text.substring(0, 50) } : null;
      })
      .filter(item => item !== null) as { id: string; text: string }[];

    return {
      currentPage: aiContext.currentPage || 'dashboard',
      activeModal: aiContext.activeModal || null,
      visibleElements: interactiveElements.map(e => `${e.id} ("${e.text}")`),
      workflowState: {
        uploadState: aiContext.uploadState,
        selectedRes: aiContext.selectedReservation,
        isNarrationPlaying: false // Captured from voice store elsewhere
      },
      hasErrors: aiContext.currentErrors.length > 0,
      currentLanguage: aiContext.language || 'en'
    };
  }

  /**
   * Analyzes the context and returns the most probable "next tactical move"
   */
  public async analyzeState(context: ScreenContext): Promise<{
    suggestion: string;
    targetId: string | null;
    highlight: 'pulse' | 'spotlight' | 'arrow';
  }> {
    // Logic to determine what the user should do next based on screen
    if (context.currentPage === 'reservations' && !context.activeModal) {
      return {
        suggestion: "To manage your units, initiate a new entry by clicking the 'New Reservation' button.",
        targetId: "new-reservation-btn",
        highlight: "pulse"
      };
    }

    if (context.activeModal === 'new_reservation') {
      const nameInput = document.getElementById('customer-name-input');
      if (nameInput && !(nameInput as HTMLInputElement).value) {
        return {
          suggestion: "Please enter the unit designation (Guest Name) to proceed.",
          targetId: "customer-name-input",
          highlight: "arrow"
        };
      }
    }

    return {
      suggestion: "Tactical core ready. Awaiting your operational command.",
      targetId: null,
      highlight: "pulse"
    };
  }
}

export const contextVision = ContextVision8848.getInstance();

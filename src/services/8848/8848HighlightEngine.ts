import { UITracker8848 } from './8848UITracker';

export type HighlightType = 'pulse' | 'spotlight' | 'focus' | 'arrow';

export class HighlightEngine8848 {
  private static instance: HighlightEngine8848;

  private constructor() {}

  public static getInstance(): HighlightEngine8848 {
    if (!HighlightEngine8848.instance) {
      HighlightEngine8848.instance = new HighlightEngine8848();
    }
    return HighlightEngine8848.instance;
  }

  public highlight(selector: string, type: HighlightType = 'pulse') {
    const realSelector = UITracker8848.getSelector(selector);
    const el = document.querySelector(realSelector);
    
    if (!el) {
      console.warn(`8848 Highlight: Element not found for ${selector} (${realSelector})`);
      return;
    }

    // Auto-scroll if needed
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Emit event for visual components
    window.dispatchEvent(new CustomEvent(`8848-guidance-${type}`, { 
      detail: { selector: realSelector } 
    }));
  }

  public clear() {
    window.dispatchEvent(new CustomEvent('8848-guidance-clear'));
  }
}

export const highlightEngine = HighlightEngine8848.getInstance();

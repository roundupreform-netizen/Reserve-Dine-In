import { useAIStore } from '../../store/useAIStore';
import { NavItem } from '../../components/layout/Sidebar';
import { highlightEngine } from './8848HighlightEngine';
import { UITracker8848 } from './8848UITracker';

interface NavigationAction {
  type: 'navigate';
  params: { page: NavItem; section?: string };
}

interface ModalAction {
  type: 'openModal' | 'closeModal';
  params: { modalName: string };
}

interface HighlightAction {
  type: 'highlight' | 'pulse' | 'spotlight' | 'focus' | 'arrow';
  params: { selector: string; advice?: string };
}

interface ScrollAction {
  type: 'scroll';
  params: { selector: string };
}

interface WaitAction {
  type: 'waitForClick';
  params: { selector: string };
}

export type UIAction = NavigationAction | ModalAction | HighlightAction | ScrollAction | WaitAction;

class NavigationEngine8848 {
  private static instance: NavigationEngine8848;
  private setTab: ((tab: NavItem) => void) | null = null;
  private setModal: ((name: string, open: boolean) => void) | null = null;

  private constructor() {}

  public static getInstance(): NavigationEngine8848 {
    if (!NavigationEngine8848.instance) {
      NavigationEngine8848.instance = new NavigationEngine8848();
    }
    return NavigationEngine8848.instance;
  }

  public register(handlers: { setTab: (tab: NavItem) => void; setModal: (name: string, open: boolean) => void }) {
    this.setTab = handlers.setTab;
    this.setModal = handlers.setModal;
  }

  public navigate(page: NavItem) {
    if (this.setTab) this.setTab(page);
    // Clear highlights on navigation to avoid ghosts
    highlightEngine.clear();
  }

  public toggleModal(name: string, open: boolean) {
    if (this.setModal) this.setModal(name, open);
    // Clear highlights when modal changes
    highlightEngine.clear();
  }
}

class ActionEngine8848 {
  private static instance: ActionEngine8848;

  private constructor() {}

  public static getInstance(): ActionEngine8848 {
    if (!ActionEngine8848.instance) {
      ActionEngine8848.instance = new ActionEngine8848();
    }
    return ActionEngine8848.instance;
  }

  public async execute(action: UIAction) {
    if (!action || !action.type) return;
    console.log('8848 Action Engine Executing:', action);

    // Safeguard for params
    if (!action.params) {
      console.warn('8848 Action Engine: Received action with missing params', action);
      return;
    }

    const { params } = action;

    switch (action.type) {
      case 'navigate':
        if ('page' in params) {
          navigationEngine.navigate(params.page);
        }
        break;
      
      case 'openModal':
        if ('modalName' in params) {
          navigationEngine.toggleModal(params.modalName, true);
        }
        break;

      case 'closeModal':
        if ('modalName' in params) {
          navigationEngine.toggleModal(params.modalName, false);
        }
        break;

      case 'highlight':
        if ('selector' in params) {
          highlightEngine.highlight(params.selector, 'focus');
        }
        break;
      
      case 'pulse':
        if ('selector' in params) {
          highlightEngine.highlight(params.selector, 'pulse');
          // Legacy dispatch support
          window.dispatchEvent(new CustomEvent('8848-pulse-active', { detail: { selector: UITracker8848.getSelector(params.selector) } }));
        }
        break;

      case 'scroll':
        if ('selector' in params) {
          highlightEngine.highlight(params.selector, 'pulse'); // Scroll is built into highlightEngine
        }
        break;

      case 'spotlight':
        if ('selector' in params) {
          highlightEngine.highlight(params.selector, 'spotlight');
          highlightEngine.highlight(params.selector, 'arrow');
        }
        break;

      case 'waitForClick':
        if ('selector' in params) {
          highlightEngine.highlight(params.selector, 'pulse');
          highlightEngine.highlight(params.selector, 'arrow');
          await this.waitForInteraction(UITracker8848.getSelector(params.selector));
        }
        break;
    }
  }

  public async waitForInteraction(selector: string, timeout = 30000): Promise<boolean> {
    const realSelector = UITracker8848.getSelector(selector);
    return new Promise((resolve) => {
      const el = document.querySelector(realSelector);
      if (!el) {
        resolve(false);
        return;
      }

      const controller = new AbortController();
      const timer = setTimeout(() => {
        controller.abort();
        resolve(false);
      }, timeout);

      el.addEventListener('click', () => {
        clearTimeout(timer);
        controller.abort();
        // Clear highlights after interaction
        highlightEngine.clear();
        resolve(true);
      }, { once: true, signal: controller.signal });
    });
  }
}

export const navigationEngine = NavigationEngine8848.getInstance();
export const actionEngine = ActionEngine8848.getInstance();

import { getAIResponse } from './geminiService';
import { findLocalResponse } from '../../ai/localFallback/localResponses';
import { useAIStore } from '../../store/useAIStore';

interface QueueItem {
  prompt: string;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timestamp: number;
}

class AIRequestQueue {
  private static instance: AIRequestQueue;
  private queue: QueueItem[] = [];
  private processing: boolean = false;
  private cache: Map<string, { response: any, timestamp: number }> = new Map();
  private CACHE_TTL = 1000 * 60 * 5; // 5 minutes
  private lastRequestTime = 0;
  private MIN_DELAY = 1500; // 1.5s between requests

  private constructor() {}

  public static getInstance(): AIRequestQueue {
    if (!AIRequestQueue.instance) {
      AIRequestQueue.instance = new AIRequestQueue();
    }
    return AIRequestQueue.instance;
  }

  public async request(prompt: string): Promise<any> {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return { content: "", actions: [] };

    // 1. Check Cache
    const cached = this.cache.get(cleanPrompt);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      return cached.response;
    }

    // 2. Check for duplicate pending request
    const isPending = this.queue.some(item => item.prompt === cleanPrompt);
    if (isPending) return new Promise(resolve => { /* join existing or ignore */ });

    return new Promise((resolve, reject) => {
      this.queue.push({ prompt: cleanPrompt, resolve, reject, timestamp: Date.now() });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    // Enforce minimum delay between requests
    const now = Date.now();
    const timeSinceLast = now - this.lastRequestTime;
    if (timeSinceLast < this.MIN_DELAY) {
      setTimeout(() => this.processQueue(), this.MIN_DELAY - timeSinceLast);
      return;
    }

    this.processing = true;
    const item = this.queue.shift();

    if (item) {
      try {
        const { context, messages: history } = useAIStore.getState();
        this.lastRequestTime = Date.now();
        
        const response = await getAIResponse(item.prompt, context, history);
        this.cache.set(item.prompt, { response, timestamp: Date.now() });
        item.resolve(response);
      } catch (err) {
        console.error("Queue Error:", err);
        const local = findLocalResponse(item.prompt);
        item.resolve({ 
          content: local || "8848 AI is operating in limited capacity. Please retry your tactical query.", 
          actions: [],
          mode: 'error-fallback'
        });
      }
    }

    this.processing = false;
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), this.MIN_DELAY);
    }
  }
}

export const aiQueue = AIRequestQueue.getInstance();

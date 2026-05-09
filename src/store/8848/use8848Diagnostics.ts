import { create } from 'zustand';

export interface DiagnosticIssue {
  id: string;
  type: 'conflict' | 'stale' | 'invalid_data' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedElement?: string; // CSS selector
  suggestedFix?: string;
  actionParams?: any;
}

interface DiagnosticsState {
  isScanning: boolean;
  issues: DiagnosticIssue[];
  activeIssue: DiagnosticIssue | null;
  
  startScan: () => void;
  setIssues: (issues: DiagnosticIssue[]) => void;
  setIsScanning: (isScanning: boolean) => void;
  setActiveIssue: (issue: DiagnosticIssue | null) => void;
  clearIssues: () => void;
}

export const use8848Diagnostics = create<DiagnosticsState>((set) => ({
  isScanning: false,
  issues: [],
  activeIssue: null,

  startScan: () => set({ isScanning: true, issues: [] }),
  setIssues: (issues) => set({ issues, isScanning: false }),
  setIsScanning: (isScanning) => set({ isScanning }),
  setActiveIssue: (issue) => set({ activeIssue: issue }),
  clearIssues: () => set({ issues: [], activeIssue: null }),
}));

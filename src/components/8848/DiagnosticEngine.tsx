import React, { useEffect } from 'react';
import { useAIStore } from '../../store/useAIStore';
import { use8848Diagnostics } from '../../store/8848/use8848Diagnostics';
import { analyzeSystemState } from '../../services/8848/8848Diagnostics';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle, Search, ShieldAlert, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

const DiagnosticEngine = () => {
  const { updateContext, context } = useAIStore();
  const { isScanning, issues, setIssues, setIsScanning, activeIssue, setActiveIssue, clearIssues } = use8848Diagnostics();
  const { t } = useTranslation();

  // Background monitoring removed to prevent internal Firestore assertion conflicts (ID: ca9)
  // Background monitoring for ambient errors
  /* 
  useEffect(() => {
    const reservationsRef = collection(db, 'reservations');
    const q = query(reservationsRef, where('status', 'not-in', ['cancelled', 'completed']));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // ...
    });

    return () => unsubscribe();
  }, []);
  */

  // Handle active manual scan
  useEffect(() => {
    if (isScanning) {
      const performScan = async () => {
        // Fetch fresh data for analysis
        const reservationsSnapshot = await getDocs(collection(db, 'reservations'));
        const reservations = reservationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
        
        const detectedIssues = await analyzeSystemState(context, { reservations });
        setIssues(detectedIssues);
      };

      performScan();
    }
  }, [isScanning]);

  if (!isScanning && issues.length === 0) return null;

  return (
    <AnimatePresence>
      {(isScanning || issues.length > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-[#0F0F12] border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_0_80px_rgba(139,92,246,0.2)]"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <ShieldAlert className="text-purple-400" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">{t('ai.diagnostics')}</h2>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">8848 Tactical Scan</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsScanning(false); clearIssues(); }}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X size={14} className="text-white/40" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8">
              {isScanning ? (
                <div className="flex flex-col items-center py-12">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 180, 360]
                    }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="w-24 h-24 rounded-full border-2 border-dashed border-purple-500/30 flex items-center justify-center relative"
                  >
                    <Search className="text-purple-500" size={32} />
                    <motion.div 
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute inset-0 bg-purple-500/10 rounded-full" 
                    />
                  </motion.div>
                  <p className="mt-8 text-sm font-medium text-white/60 animate-pulse uppercase tracking-[0.2em]">{t('ai.thinking')}</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                  {issues.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <CheckCircle className="text-emerald-500 mb-4" size={48} />
                      <h3 className="text-white font-bold">No Issues Detected</h3>
                      <p className="text-white/40 text-xs mt-1">Operational integrity at 100%.</p>
                    </div>
                  ) : (
                    issues.map((issue) => (
                      <motion.div
                        key={issue.id}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:border-purple-500/30 transition-all cursor-pointer group"
                        onClick={() => setActiveIssue(issue)}
                      >
                        <div className="flex gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            issue.severity === 'critical' ? "bg-red-500/20 text-red-400" :
                            issue.severity === 'high' ? "bg-amber-500/20 text-amber-400" :
                            "bg-blue-500/20 text-blue-400"
                          )}>
                            <AlertCircle size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">{issue.title}</h4>
                            <p className="text-xs text-white/40 mt-1 leading-relaxed">{issue.description}</p>
                            {issue.suggestedFix && (
                              <button className="mt-3 px-3 py-1.5 bg-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-purple-500/20 hover:bg-purple-500 hover:text-white transition-all">
                                {issue.suggestedFix}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            {!isScanning && (
              <div className="p-6 bg-white/[0.02] border-t border-white/5">
                <button 
                  onClick={() => setIsScanning(true)}
                  className="w-full h-12 rounded-xl bg-purple-500 text-white text-xs font-black uppercase tracking-widest hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20"
                >
                  Rescan System
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DiagnosticEngine;

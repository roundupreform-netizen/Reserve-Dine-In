import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  Edit3, 
  Save, 
  ChevronRight,
  Database,
  Search,
  History,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit, writeBatch, doc } from 'firebase/firestore';
import { extractMenuFromImage, extractMenuFromText, ExtractedMenuItem } from '../../services/MenuExtractionService';
import { Button } from '../ui/core';
import { cn } from '../../lib/utils';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'extracting' | 'review' | 'saving' | 'completed' | 'error';

interface MenuUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuType: 'dine-in' | 'high-tea';
  onComplete: () => void;
}

export default function MenuUploadModal({ isOpen, onClose, menuType, onComplete }: MenuUploadModalProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [extractedItems, setExtractedItems] = useState<ExtractedMenuItem[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    try {
      const q = query(collection(db, 'menuUploadHistory'), orderBy('createdAt', 'desc'), limit(5));
      const snap = await getDocs(q);
      setUploadHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const simulateProgress = (start: number, end: number, duration: number) => {
    return new Promise<void>((resolve) => {
      const step = 5;
      const interval = duration / ((end - start) / step);
      let current = start;
      const timer = setInterval(() => {
        current += step;
        setProgress(current);
        if (current >= end) {
          clearInterval(timer);
          resolve();
        }
      }, interval);
    });
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File too large (Max 25MB+)');
      setStatus('error');
      return;
    }

    setCurrentFile(file);
    setStatus('uploading');
    setProgress(0);

    try {
      // Step 1: "Upload" (Simulated local read)
      await simulateProgress(0, 30, 800);
      
      // Step 2: Processing
      setStatus('processing');
      await simulateProgress(30, 60, 1000);

      // Step 3: Extracting
      setStatus('extracting');
      
      let items: ExtractedMenuItem[] = [];

      if (file.type.includes('image') || file.type.includes('pdf')) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        const base64 = await base64Promise;
        const extracted = await extractMenuFromImage(base64, file.type);
        items = extracted;
      } else if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const extracted = await extractMenuFromText(text);
        items = extracted;
      } else if (file.name.endsWith('.xlsx')) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);
        const text = JSON.stringify(json);
        const extracted = await extractMenuFromText(text);
        items = extracted;
      } else {
        throw new Error('Unsupported file format');
      }

      setExtractedItems(items);
      await simulateProgress(60, 100, 500);
      setStatus('review');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Menu extraction failed. Ensure clearly visible text.');
      setStatus('error');
    }
  };

  const handleRestore = (log: any) => {
    setExtractedItems(log.items || []);
    setCurrentFile({ name: log.fileName, size: log.fileSize, type: log.fileType } as any);
    setStatus('review');
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg'],
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  const handleSaveItems = async () => {
    setStatus('saving');
    try {
      const batch = writeBatch(db);
      extractedItems.forEach((item, index) => {
        const docRef = doc(collection(db, 'menuItems'));
        batch.set(docRef, {
          ...item,
          menuType,
          order: index,
          updatedAt: serverTimestamp()
        });
      });

      // Log to history
      const historyRef = doc(collection(db, 'menuUploadHistory'));
      batch.set(historyRef, {
        fileName: currentFile?.name || 'Restored Menu',
        fileSize: currentFile?.size || 0,
        fileType: currentFile?.type || 'restored',
        itemCount: extractedItems.length,
        items: extractedItems, // Save items for restoration
        menuType,
        createdAt: serverTimestamp()
      });

      await batch.commit();
      setStatus('completed');
      setTimeout(() => {
        onComplete();
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to save menu items to database');
      setStatus('error');
    }
  };

  const handleUpdateExtractedItem = (index: number, updates: Partial<ExtractedMenuItem>) => {
    const newItems = [...extractedItems];
    newItems[index] = { ...newItems[index], ...updates };
    setExtractedItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setExtractedItems(extractedItems.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose} 
          className="absolute inset-0 bg-black/90 backdrop-blur-2xl" 
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-[#0F0F12] border border-white/10 rounded-[3rem] overflow-hidden flex flex-col max-h-[85vh] shadow-[0_0_150px_rgba(0,0,0,1)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
            <div className="space-y-0.5">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500">
                  <Upload size={20} />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Import Studio</h2>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
              <X size={20} className="text-white/40" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-6">
            {status === 'idle' && (
              <div className="space-y-8">
                <div 
                  {...getRootProps()} 
                  className={cn(
                    "relative py-12 border-2 border-dashed rounded-3xl transition-all flex flex-col items-center justify-center text-center space-y-4 group cursor-pointer",
                    isDragActive ? "border-amber-500 bg-amber-500/5" : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03]"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/10 group-hover:text-amber-500 transition-colors">
                    <Upload size={32} strokeWidth={1} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white tracking-tight uppercase">Upload Menu</h3>
                    <p className="text-[10px] text-white/30 max-w-[200px] mx-auto">Drop PDF, Image, CSV or Excel files for AI extraction.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <History size={14} className="text-white/20" />
                    <h4 className="text-[9px] font-black text-white/20 uppercase tracking-widest">Recent Imports</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {uploadHistory.map((log) => (
                      <div key={log.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/[0.04] transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20">
                            {log.fileType?.includes('image') ? <ImageIcon size={14} /> : <FileText size={14} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-white truncate max-w-[120px]">{log.fileName}</p>
                            <p className="text-[8px] font-medium text-white/20 uppercase tracking-widest">
                               {log.itemCount} items • {new Date(log.createdAt?.toDate()).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRestore(log)}
                          className="p-2 hover:bg-white/10 rounded-lg text-white/20 hover:text-amber-500 transition-colors"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(status === 'uploading' || status === 'processing' || status === 'extracting' || status === 'saving') && (
              <div className="flex flex-col items-center justify-center py-24 space-y-12">
                <div className="relative">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <Loader2 size={48} className="animate-spin" />
                  </div>
                  <div className="absolute -inset-4 bg-amber-500/20 blur-3xl opacity-20 animate-pulse rounded-full" />
                </div>

                <div className="text-center space-y-4 max-w-sm">
                  <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
                    {status === 'uploading' && 'Uploading Content...'}
                    {status === 'processing' && 'Processing File...'}
                    {status === 'extracting' && 'AI Extraction Active...'}
                    {status === 'saving' && 'Persisting Menu Data...'}
                  </h3>
                  <p className="text-sm text-white/30 font-medium">
                    {status === 'uploading' && 'Streaming raw data to secure vectors.'}
                    {status === 'processing' && 'Validating document structure and schema.'}
                    {status === 'extracting' && 'Gemini AI identifies dishes, prices and categories.'}
                    {status === 'saving' && 'Finalizing records into your global catalog.'}
                  </p>
                </div>

                <div className="w-80 h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500"
                  />
                </div>
                
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] font-mono">{progress}% SYNC</p>
              </div>
            )}

            {status === 'completed' && (
              <div className="flex flex-col items-center justify-center py-24 space-y-8">
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-32 h-32 rounded-[2.5rem] bg-emerald-500 flex items-center justify-center text-black"
                >
                  <CheckCircle2 size={64} />
                </motion.div>
                <div className="text-center space-y-2">
                  <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Import Complete</h3>
                  <p className="text-sm text-white/30 font-medium">Your menu has been updated globally across all outlets.</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center justify-center py-24 space-y-10">
                <div className="w-32 h-32 rounded-[2.5rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                  <AlertCircle size={64} />
                </div>
                <div className="text-center space-y-4 max-w-sm">
                  <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Operation Failed</h3>
                  <p className="text-sm text-red-500/60 font-medium">{errorMessage}</p>
                </div>
                <Button onClick={() => setStatus('idle')} className="h-16 px-10 bg-white/5 hover:bg-white text-white/40 hover:text-black font-black uppercase tracking-widest rounded-3xl transition-all border border-white/5">Try Again</Button>
              </div>
            )}

            {status === 'review' && (
              <div className="space-y-6 pb-4">
                <div className="flex items-center justify-between px-2">
                   <div className="flex items-center gap-3">
                     <div className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
                        <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">AI Detection</span>
                     </div>
                     <p className="text-white/40 text-[10px] font-medium">{extractedItems.length} items detected</p>
                   </div>
                </div>

                <div className="bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                  {extractedItems.map((item, index) => (
                    <div 
                      key={index}
                      className="px-6 py-3 flex items-center gap-6 group hover:bg-white/[0.02] transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <input 
                            type="text" 
                            value={item.name} 
                            onChange={(e) => handleUpdateExtractedItem(index, { name: e.target.value })}
                            className="bg-transparent border-none p-0 text-sm font-black text-white uppercase focus:ring-0 w-full"
                          />
                        </div>
                        <input 
                          type="text" 
                          value={item.category} 
                          onChange={(e) => handleUpdateExtractedItem(index, { category: e.target.value })}
                          className="bg-transparent border-none p-0 text-[10px] text-amber-500/60 uppercase font-black focus:ring-0 w-full"
                        />
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 border border-white/5">
                          <span className="text-[10px] text-white/20 font-bold">₹</span>
                          <input 
                            type="number" 
                            value={item.price} 
                            onChange={(e) => handleUpdateExtractedItem(index, { price: parseFloat(e.target.value) })}
                            className="w-16 bg-transparent border-none p-2 text-xs text-white font-mono focus:ring-0 text-right"
                          />
                        </div>

                        <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5">
                           <button 
                             onClick={() => handleUpdateExtractedItem(index, { type: 'veg' })}
                             className={cn("px-3 py-1 rounded-md text-[8px] font-black uppercase transition-all", item.type === 'veg' ? "bg-green-500 text-black shadow-sm" : "text-white/20")}
                           >Veg</button>
                           <button 
                             onClick={() => handleUpdateExtractedItem(index, { type: 'non-veg' })}
                             className={cn("px-3 py-1 rounded-md text-[8px] font-black uppercase transition-all", item.type === 'non-veg' ? "bg-red-500 text-black shadow-sm" : "text-white/20")}
                           >Non-Veg</button>
                        </div>

                        <button 
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 text-white/10 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Action Footer */}
          {status === 'review' && (
            <div className="p-6 bg-white/[0.02] border-t border-white/5 flex justify-end gap-3">
               <Button onClick={onClose} variant="ghost" className="h-10 px-6 text-white/40 font-black uppercase tracking-widest text-[10px]">Discard</Button>
               <Button onClick={handleSaveItems} className="h-10 px-8 bg-amber-500 hover:bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg transition-all flex items-center gap-2">
                 <Save size={16} />
                 Finalize
               </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

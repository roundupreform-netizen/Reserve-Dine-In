import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  X,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeLayoutFile, DetectedTable } from '../../services/aiLayoutService';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface TableLayoutUploadProps {
  onDataDetected: (tables: DetectedTable[]) => void;
  onClose: () => void;
}

const TableLayoutUpload: React.FC<TableLayoutUploadProps> = ({ onDataDetected, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    
    try {
      const detected = await analyzeLayoutFile(file);
      onDataDetected(detected);
    } catch (err) {
      setError("AI analysis failed. Please ensure the file is clear and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-[#121215] border border-white/10 rounded-[3rem] p-10 relative overflow-hidden"
      >
        {/* Glow Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <X size={20} className="text-white/40" />
        </button>

        <div className="flex flex-col items-center text-center space-y-8">
          <div className="bg-amber-500/10 p-5 rounded-[2rem] border border-amber-500/20">
            <Sparkles size={40} className="text-amber-500" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white tracking-tight uppercase">AI Layout Processor</h2>
            <p className="text-white/40 text-sm font-medium">Upload your seating chart or table draft. AI will auto-detect configurations.</p>
          </div>

          <div 
            {...getRootProps()} 
            className={cn(
              "w-full border-2 border-dashed rounded-[2.5rem] p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-4",
              isDragActive ? "border-amber-500 bg-amber-500/5" : "border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
            )}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-amber-500 shadow-xl">
                  {file.type.includes('image') ? <ImageIcon size={32} /> : <FileText size={32} />}
                </div>
                <div className="space-y-1">
                  <p className="text-white font-black text-sm uppercase tracking-wider">{file.name}</p>
                  <p className="text-white/20 text-[10px] font-bold">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/20">
                  <Upload size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-white/60 font-black text-sm uppercase tracking-wider">Drag & Drop Layout Draft</p>
                  <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">CSV, Excel, PDF, or Images supported</p>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="flex gap-4 w-full pt-4">
            <Button 
              onClick={onClose}
              className="flex-1 h-16 bg-white/5 hover:bg-white/10 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleProcess}
              disabled={!file || isProcessing}
              className="flex-3 h-16 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/20 text-black rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-[0_20px_50px_rgba(245,158,11,0.2)]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={18} />
                  AI Analysing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2" size={18} />
                  Process with AI
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Decorative background glass */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/10 blur-[150px] -z-10 rounded-full" />
    </div>
  );
};

export default TableLayoutUpload;

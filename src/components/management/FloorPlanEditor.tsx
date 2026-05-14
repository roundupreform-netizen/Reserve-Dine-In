import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  RotateCw, 
  Maximize2, 
  Move, 
  Grid, 
  MousePointer2,
  ZoomIn,
  ZoomOut,
  Layers,
  Save,
  Undo2,
  Check,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

export interface LayoutTable {
  id: string;
  name: string;
  capacity: number;
  x: number;
  y: number;
  rotation: number;
  shape: 'square' | 'round' | 'rectangle' | 'sofa';
  type: 'standard' | 'vip' | 'bar' | 'outdoor' | 'booth';
  status?: string;
}

interface FloorPlanEditorProps {
  tables: LayoutTable[];
  onSave: (tables: LayoutTable[]) => void;
  onClose: () => void;
}

const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({ tables: initialTables, onSave, onClose }) => {
  const [tables, setTables] = useState<LayoutTable[]>(initialTables);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState<'select' | 'move' | 'add'>('select');
  const [showGrid, setShowGrid] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedTable = tables.find(t => t.id === selectedId);

  const handleUpdateTable = (id: string, updates: Partial<LayoutTable>) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleDrag = (id: string, info: any) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Snap to grid (20px)
    const snap = 20;
    const x = Math.round(info.point.x / snap) * snap;
    const y = Math.round(info.point.y / snap) * snap;
    
    // Simple bounds check omitted for brevity in draft
  };

  const addTable = (shape: LayoutTable['shape'] = 'square') => {
    const newTable: LayoutTable = {
      id: `new-${Date.now()}`,
      name: `${tables.length + 1}`,
      capacity: 4,
      x: 100,
      y: 100,
      rotation: 0,
      shape,
      type: 'standard'
    };
    setTables([...tables, newTable]);
    setSelectedId(newTable.id);
  };

  const deleteTable = (id: string) => {
    setTables(prev => prev.filter(t => t.id !== id));
    setSelectedId(null);
  };

  const renderTable = (table: LayoutTable) => {
    const isSelected = selectedId === table.id;
    const size = table.shape === 'rectangle' ? { w: 100, h: 60 } : { w: 60, h: 60 };
    
    return (
      <motion.div
        key={table.id}
        drag={mode === 'move'}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          const container = containerRef.current;
          if (!container) return;
          const rect = container.getBoundingClientRect();
          const x = (info.point.x - rect.left) / zoom;
          const y = (info.point.y - rect.top) / zoom;
          handleUpdateTable(table.id, { x, y });
        }}
        onClick={() => setSelectedId(table.id)}
        initial={false}
        animate={{ 
          x: table.x, 
          y: table.y, 
          rotate: table.rotation,
          scale: isSelected ? 1.05 : 1
        }}
        className={cn(
          "absolute cursor-pointer flex items-center justify-center transition-shadow",
          isSelected ? "z-50 ring-2 ring-amber-500 shadow-2xl" : "z-10 bg-white/5 border border-white/10 hover:border-white/30",
          table.shape === 'round' ? "rounded-full" : "rounded-xl"
        )}
        style={{ 
          width: size.w, 
          height: size.h,
          backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.03)'
        }}
      >
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{table.name}</span>
          <span className="text-[8px] font-bold text-white/20 mt-0.5">{table.capacity} PAX</span>
        </div>
        
        {isSelected && (
          <div className="absolute -top-3 -right-3 flex gap-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateTable(table.id, { rotation: (table.rotation + 45) % 360 });
              }}
              className="bg-amber-500 text-black p-1 rounded-full shadow-lg"
            >
              <RotateCw size={10} />
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0c] z-[200] flex flex-col font-sans">
      {/* Top Bar */}
      <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between backdrop-blur-xl bg-black/40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-black">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Floor Plan Designer</h2>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-tight">Active Draft • V.1.04</p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-white/5 mx-2" />
          
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            {[
              { id: 'select', icon: MousePointer2, label: 'Select' },
              { id: 'move', icon: Move, label: 'Move' },
              { id: 'add', icon: Plus, label: 'Add' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                  mode === m.id ? "bg-amber-500 text-black" : "text-white/20 hover:text-white/40"
                )}
              >
                <m.icon size={12} />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
            <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="text-white/20 hover:text-white"><ZoomOut size={16} /></button>
            <span className="text-[10px] font-black text-white min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="text-white/20 hover:text-white"><ZoomIn size={16} /></button>
          </div>
          <Button 
            className="bg-white/5 text-white hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase tracking-widest text-[10px] px-6 h-10"
            onClick={onClose}
          >
            Discard
          </Button>
          <Button 
            className="bg-amber-500 text-black hover:bg-amber-600 rounded-xl font-black uppercase tracking-widest text-[10px] px-8 h-10 shadow-lg shadow-amber-500/20"
            onClick={() => {
              setIsSaving(true);
              setTimeout(() => {
                onSave(tables);
                setIsSaving(false);
                onClose();
              }, 1000);
            }}
            disabled={isSaving}
          >
            {isSaving ? "Syncing..." : "Publish Layout"}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Tools */}
        <aside className="w-72 border-r border-white/5 bg-black/60 backdrop-blur-md p-6 space-y-8 overflow-y-auto">
          <div>
            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 block">Table Toolbox</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { shape: 'square', label: 'Square' },
                { shape: 'round', label: 'Round' },
                { shape: 'rectangle', label: 'Long' },
                { shape: 'sofa', label: 'Booth' },
              ].map((t) => (
                <button
                  key={t.shape}
                  onClick={() => addTable(t.shape as any)}
                  className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-amber-500/30 transition-all gap-2 group"
                >
                  <div className={cn(
                    "w-8 h-8 border-2 border-white/20 group-hover:border-amber-500/50 transition-colors",
                    t.shape === 'round' ? 'rounded-full' : 'rounded-lg'
                  )} />
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {selectedTable && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 pt-6 border-t border-white/5"
              >
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Table Settings</label>
                  <button onClick={() => deleteTable(selectedTable.id)} className="text-red-500/40 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Identifier</label>
                    <input 
                      type="text" 
                      value={selectedTable.name}
                      onChange={(e) => handleUpdateTable(selectedTable.id, { name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Capacity (PAX)</label>
                    <input 
                      type="number" 
                      value={selectedTable.capacity}
                      onChange={(e) => handleUpdateTable(selectedTable.id, { capacity: parseInt(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Type</label>
                    <select 
                      value={selectedTable.type}
                      onChange={(e) => handleUpdateTable(selectedTable.id, { type: e.target.value as any })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                    >
                      <option value="standard">Standard</option>
                      <option value="vip">VIP</option>
                      <option value="bar">Bar Stool</option>
                      <option value="outdoor">Outdoor</option>
                      <option value="booth">Booth</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat">
          <div 
            ref={containerRef}
            className="absolute inset-0 origin-top-left transition-transform duration-200"
            style={{ 
              transform: `scale(${zoom})`,
              width: '2000px',
              height: '2000px'
            }}
          >
            {showGrid && (
              <div 
                className="absolute inset-0 pointer-events-none" 
                style={{ 
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
                }}
              />
            )}
            
            {tables.map(renderTable)}
          </div>

          <div className="absolute bottom-8 right-8 flex flex-col gap-3">
             <div className="bg-amber-500/10 border border-amber-500/20 backdrop-blur-md px-4 py-3 rounded-2xl flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">AI Spacing: Optimized</span>
             </div>
             <button 
              onClick={() => setShowGrid(!showGrid)}
              className={cn(
                "w-12 h-12 rounded-2xl border transition-all flex items-center justify-center",
                showGrid ? "bg-amber-500 text-black border-amber-500" : "bg-white/5 text-white/40 border-white/5"
              )}
             >
                <Grid size={18} />
             </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FloorPlanEditor;

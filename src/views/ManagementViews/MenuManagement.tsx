import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  UtensilsCrossed, 
  Coffee, 
  Image as ImageIcon,
  Save,
  X,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Tag,
  Upload,
  FileText,
  Clock,
  Flame,
  ShieldAlert,
  LayoutGrid,
  List,
  Eye,
  Copy,
  ChevronDown,
  ArrowUpRight,
  Loader2,
  GripVertical
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch, orderBy } from 'firebase/firestore';
import { Button, GlassCard } from '../../components/ui/core';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { extractMenuFromImage } from '../../services/MenuExtractionService';

import MenuUploadModal from '../../components/modals/MenuUploadModal';

interface MenuItem {
  id?: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  type: 'veg' | 'non-veg';
  menuType: 'dine-in' | 'high-tea';
  status: 'Available' | 'Out of Stock' | 'Seasonal' | 'Chef Special' | 'Hidden';
  prepTime: string;
  spiceLevel: number;
  allergens: string[];
  isRecommended: boolean;
  order: number;
}

const MenuManagement = ({ initialMenuType = 'dine-in' }: { initialMenuType?: 'dine-in' | 'high-tea' }) => {
  const { user, userData } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuType, setMenuType] = useState<'dine-in' | 'high-tea'>(initialMenuType);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showLivePreview, setShowLivePreview] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [extractedItems, setExtractedItems] = useState<any[]>([]);
  const [formData, setFormData] = useState<MenuItem>({
    name: '',
    category: 'Starters',
    description: '',
    price: 0,
    image: '',
    isAvailable: true,
    type: 'veg',
    menuType: 'dine-in',
    status: 'Available',
    prepTime: '15 mins',
    spiceLevel: 0,
    allergens: [],
    isRecommended: false,
    order: 0
  });

  const categories = useMemo(() => {
    return menuType === 'dine-in' 
      ? ['All', 'Starters', 'Main Course', 'Dessert', 'Drinks', 'Beverages', 'Tandoor']
      : ['All', 'Snacks', 'Tea', 'Coffee', 'Desserts', 'Bakery', 'Finger Foods'];
  }, [menuType]);

  useEffect(() => {
    if (!user || !userData) return;

    setLoading(true);
    const q = query(collection(db, 'menuItems'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'menuItems');
    });
    return unsub;
  }, [user, userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...formData, menuType, updatedAt: serverTimestamp() };
      if (editingItem) {
        await updateDoc(doc(db, 'menuItems', editingItem.id), data);
      } else {
        await addDoc(collection(db, 'menuItems'), data);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      resetForm();
    } catch (error) {
      console.error("Error saving menu item:", error);
    }
  };

  const onDrop = () => {
    setIsUploadModalOpen(true);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    noClick: true,
    noKeyboard: true
  });

  const handleBulkImport = async () => {
    try {
      const batch = writeBatch(db);
      extractedItems.forEach(item => {
        const docRef = doc(collection(db, 'menuItems'));
        batch.set(docRef, { ...item, updatedAt: serverTimestamp() });
      });
      await batch.commit();
      setIsUploadModalOpen(false);
      setExtractedItems([]);
    } catch (error) {
      console.error("Bulk import failed:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: categories[1] || 'Starters',
      description: '',
      price: 0,
      isAvailable: true,
      type: 'veg',
      menuType,
      status: 'Available',
      prepTime: '15 mins',
      spiceLevel: 0,
      allergens: [],
      isRecommended: false,
      order: 0
    });
  };

  const handleReorder = async (newOrder: MenuItem[]) => {
    setItems(newOrder); // Optimistic update
    try {
      const batch = writeBatch(db);
      newOrder.forEach((item, index) => {
        if (item.id && item.order !== index) {
          batch.update(doc(db, 'menuItems', item.id), { order: index });
        }
      });
      await batch.commit();
    } catch (error) {
      console.error("Reorder failed:", error);
    }
  };

  const filteredItems = items.filter(item => 
    item.menuType === menuType &&
    (activeCategory === 'All' || item.category === activeCategory) &&
    (item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const inputClasses = "w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-500/50 outline-none text-white transition-all";
  const labelClasses = "text-[10px] font-black text-white/20 uppercase tracking-widest mb-1.5 block";

  return (
    <div className="flex-1 p-4 lg:p-6 overflow-y-auto no-scrollbar bg-[#030303]">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
               <div className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
                 <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none">Studio</span>
               </div>
               <span className="text-white/20 font-black text-[9px] uppercase tracking-widest">• Live Sync</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white leading-none">MENU DESIGNER</h1>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="bg-white/[0.03] p-1 rounded-2xl border border-white/5 flex backdrop-blur-xl shrink-0">
              <button 
                onClick={() => setMenuType('dine-in')}
                className={cn(
                  "flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  menuType === 'dine-in' ? "bg-amber-500 text-black shadow-lg" : "text-white/30 hover:text-white/60"
                )}
              >
                <UtensilsCrossed size={14} />
                Dine-In
              </button>
              <button 
                onClick={() => setMenuType('high-tea')}
                className={cn(
                  "flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  menuType === 'high-tea' ? "bg-amber-500 text-black shadow-lg" : "text-white/30 hover:text-white/60"
                )}
              >
                <Coffee size={14} />
                High Tea
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <div onClick={() => setIsUploadModalOpen(true)} className="h-10 px-5 rounded-xl border border-white/10 flex items-center justify-center gap-2 cursor-pointer transition-all hover:bg-white/5 text-white/40">
                <Upload size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  Import
                </span>
              </div>
              
              <Button 
                onClick={() => { setEditingItem(null); resetForm(); setIsModalOpen(true); }}
                className="h-10 bg-white text-black hover:bg-amber-500 font-black uppercase tracking-widest px-6 rounded-xl transition-all flex items-center gap-2"
              >
                <Plus size={18} />
                Add
              </Button>
            </div>
          </div>
        </header>

        {/* Global Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 sticky top-0 z-30 py-2 bg-[#030303]/80 backdrop-blur-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
            <input 
              type="text" 
              placeholder="Search menu..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-6 text-xs focus:border-amber-500/30 outline-none text-white transition-all"
            />
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            <div className="flex gap-1 p-1 bg-white/[0.03] rounded-2xl border border-white/5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-4 h-9 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                    activeCategory === cat ? "bg-white/10 text-white" : "bg-transparent text-white/30 hover:text-white/60"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/5">
               <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-white/10 text-white" : "text-white/20")}>
                 <LayoutGrid size={14} />
               </button>
               <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white/10 text-white" : "text-white/20")}>
                 <List size={14} />
               </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className={cn("transition-all duration-500", showLivePreview ? "xl:col-span-8" : "xl:col-span-12")}>
            {loading ? (
              <div className={cn(
                "gap-4",
                viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-2"
              )}>
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className={cn(
                    "bg-white/[0.02] border border-white/5 rounded-xl animate-pulse",
                    viewMode === 'grid' ? "h-32" : "h-12"
                  )} />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
               <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.01] border border-white/5 rounded-3xl">
                 <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center text-white/5">
                   <UtensilsCrossed size={32} strokeWidth={1} />
                 </div>
                 <div className="space-y-1">
                   <h3 className="text-xl font-black text-white tracking-tighter uppercase">No menu items</h3>
                   <p className="text-white/20 text-xs font-medium max-w-xs">Upload or add a dish manually.</p>
                 </div>
               </div>
            ) : viewMode === 'grid' ? (
              <Reorder.Group 
                axis="y" 
                values={filteredItems} 
                onReorder={handleReorder}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item) => (
                    <MenuGridItem 
                      key={item.id} 
                      item={item} 
                      onEdit={() => { setEditingItem(item); setFormData(item); setIsModalOpen(true); }}
                      onDelete={() => deleteDoc(doc(db, 'menuItems', item.id!))}
                    />
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            ) : (
              <Reorder.Group 
                axis="y" 
                values={filteredItems} 
                onReorder={handleReorder}
                className="bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5"
              >
                {filteredItems.map((item) => (
                  <MenuListItem 
                    key={item.id} 
                    item={item}
                    onEdit={() => { setEditingItem(item); setFormData(item); setIsModalOpen(true); }}
                    onDelete={() => deleteDoc(doc(db, 'menuItems', item.id!))}
                  />
                ))}
              </Reorder.Group>
            )}
          </div>

          {showLivePreview && (
            <div className="xl:col-span-4 h-fit sticky top-24">
              <LivePreview items={items.filter(i => i.menuType === menuType)} menuType={menuType} />
            </div>
          )}
        </div>
      </div>

      {/* Main Form Modal */}
      <MenuFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        categories={categories}
      />

      {/* Bulk Import Modal */}
      <MenuUploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        menuType={menuType}
        onComplete={() => {
          // Manual state refresh if needed, although onSnapshot handles it
        }}
      />
    </div>
  );
};

// --- Sub-components for better organization ---

const MenuGridItem = ({ item, onEdit, onDelete, onDuplicate }: any) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item value={item} dragListener={false} dragControls={dragControls}>
      <motion.div 
        layout
        className="group bg-[#0A0A0C] border border-white/5 rounded-[3.5rem] overflow-hidden hover:border-amber-500/20 transition-all flex flex-col relative"
      >
        <div className="relative h-64 bg-white/[0.02] overflow-hidden">
          {/* Drag Handle */}
          <div 
            onPointerDown={(e) => dragControls.start(e)}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-20 p-2 bg-black/40 backdrop-blur-md rounded-full text-white/20 hover:text-white cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
          >
            <GripVertical size={16} />
          </div>
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/5 italic">
            <ImageIcon size={48} strokeWidth={1} />
            <span className="text-[11px] uppercase tracking-widest font-black mt-4">No Visual Visual</span>
          </div>
        )}
        
        {/* Status Indicators */}
        <div className="absolute top-6 left-6 flex flex-col gap-2">
          <div className={cn(
            "px-4 py-1.5 rounded-full border flex items-center gap-2 backdrop-blur-md shadow-2xl",
            item.status === 'Available' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
            item.status === 'Chef Special' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
            item.status === 'Seasonal' ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-500" :
            "bg-red-500/10 border-red-500/20 text-red-500"
          )}>
            <div className={cn("w-1.5 h-1.5 rounded-full", 
              item.status === 'Available' ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" :
              item.status === 'Chef Special' ? "bg-amber-500 shadow-[0_0_10px_#f59e0b]" :
              item.status === 'Seasonal' ? "bg-cyan-500 shadow-[0_0_10px_#06b6d4]" :
              "bg-red-500 shadow-[0_0_10px_#ef4444]"
            )} />
            <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">{item.status}</span>
          </div>
          
          <div className={cn(
            "w-max px-3 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-2",
            item.type === 'veg' ? "border-green-500/20 bg-green-500/10 text-green-500" : "border-red-500/20 bg-red-500/10 text-red-500"
          )}>
            <div className={cn("w-1.5 h-1.5 rounded-full", item.type === 'veg' ? "bg-green-500" : "bg-red-500")} />
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">{item.type}</span>
          </div>
        </div>

        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-y-[-10px] group-hover:translate-y-0 flex flex-col gap-2">
          <button onClick={onEdit} className="w-10 h-10 bg-white text-black rounded-2xl flex items-center justify-center hover:bg-amber-500 transition-all shadow-xl">
            <Edit3 size={18} />
          </button>
          <button onClick={onDuplicate} className="w-10 h-10 bg-white/10 backdrop-blur-md text-white rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all border border-white/10">
            <Copy size={18} />
          </button>
          <button onClick={onDelete} className="w-10 h-10 bg-red-500/20 backdrop-blur-md text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-red-500/20">
            <Trash2 size={18} />
          </button>
        </div>

        {item.isRecommended && (
           <div className="absolute bottom-6 left-6">
              <div className="bg-amber-500 text-black px-4 py-1.5 rounded-full flex items-center gap-2 shadow-2xl">
                <CheckCircle2 size={12} />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Chef Recommended</span>
              </div>
           </div>
        )}
      </div>

      <div className="p-10 flex-col flex-1 flex justify-between space-y-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">{item.category}</p>
            <h3 className="text-3xl font-black tracking-tighter text-white leading-[0.9]">{item.name}</h3>
          </div>
          <p className="text-white/30 text-xs font-medium leading-relaxed line-clamp-2">{item.description || 'Delicate hand-crafted selection preparation with premium ingredients.'}</p>
          
          <div className="flex flex-wrap gap-4 pt-2">
             <div className="flex items-center gap-2 text-white/20">
                <Clock size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">{item.prepTime || '15 mins'}</span>
             </div>
             {item.spiceLevel > 0 && (
               <div className="flex items-center gap-2 text-amber-500/60">
                  <Flame size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Spice {Array(item.spiceLevel).fill('🌶️').join('')}</span>
               </div>
             )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-8 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Price / Pack</span>
            <span className="text-4xl font-black text-white tracking-tighter">₹{item.price}</span>
          </div>
          <button className="h-12 w-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-white/20 hover:text-white transition-all border border-white/5">
             <ArrowUpRight size={20} />
          </button>
        </div>
      </div>
    </motion.div>
    </Reorder.Item>
  );
};

const MenuListItem = ({ item, onEdit, onDelete }: any) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item value={item} dragListener={false} dragControls={dragControls}>
      <div className="group bg-[#0A0A0C] border border-white/5 rounded-3xl p-6 transition-all hover:bg-white/[0.02] hover:border-white/10">
        <div className="grid grid-cols-12 items-center gap-6">
          <div className="col-span-1">
             <div 
               onPointerDown={(e) => dragControls.start(e)}
               className="p-2 text-white/10 hover:text-white cursor-grab active:cursor-grabbing transition-colors"
             >
                <GripVertical size={20} />
             </div>
          </div>
          <div className="col-span-4 flex items-center gap-6">
           <div className="w-1.5 h-16 bg-white/5 rounded-full" />
           <div className="w-20 h-20 rounded-2xl bg-white/5 overflow-hidden shrink-0 border border-white/5 group-hover:border-amber-500/20 transition-colors">
              {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/5"><ImageIcon size={24} /></div>}
           </div>
           <div className="space-y-1">
              <h4 className="text-xl font-black text-white tracking-tight leading-none">{item.name}</h4>
              <div className="flex items-center gap-3">
                <span className={cn("text-[9px] font-black uppercase tracking-widest", item.type === 'veg' ? "text-green-500" : "text-red-500")}>{item.type}</span>
                <span className="text-white/20 font-black">•</span>
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{item.prepTime}</span>
              </div>
           </div>
        </div>
        <div className="col-span-2">
           <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-3 py-1 bg-amber-500/10 rounded-lg">{item.category}</span>
        </div>
        <div className="col-span-2 text-2xl font-black text-white tracking-tighter">₹{item.price}</div>
        <div className="col-span-2">
          <div className={cn(
            "w-fit px-4 py-1.5 rounded-full border flex items-center gap-2",
            item.status === 'Available' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500"
          )}>
            <div className={cn("w-1.5 h-1.5 rounded-full", item.status === 'Available' ? "bg-emerald-500" : "bg-red-500")} />
            <span className="text-[9px] font-black uppercase tracking-widest">{item.status}</span>
          </div>
        </div>
        <div className="col-span-1 flex justify-end gap-2">
            <button onClick={onEdit} className="p-3 bg-white/5 hover:bg-white hover:text-black rounded-xl text-white/20 transition-all border border-white/5 shadow-xl"><Edit3 size={16} /></button>
            <button onClick={onDelete} className="p-3 bg-white/5 hover:bg-red-500 hover:text-white rounded-xl text-white/20 transition-all border border-white/5 shadow-xl"><Trash2 size={16} /></button>
        </div>
        </div>
      </div>
    </Reorder.Item>
  );
};

const MenuFormModal = ({ isOpen, onClose, editingItem, formData, setFormData, onSubmit, categories }: any) => {
  if (!isOpen) return null;

  const inputClasses = "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:border-amber-500/50 outline-none text-white transition-all focus:bg-white/[0.06]";
  const labelClasses = "text-[9px] font-black text-white/20 uppercase tracking-widest mb-1.5 block";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl bg-[#0F0F12] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-8 border-b border-white/5">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">{editingItem ? 'Edit' : 'New'} Dish</h2>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
              <X size={20} className="text-white/40" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="p-8 overflow-y-auto no-scrollbar space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-1.5">
                <label className={labelClasses}>Item Name</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={inputClasses} placeholder="e.g. Saffron Risotto" />
              </div>
              
              <div className="space-y-1.5">
                <label className={labelClasses}>Category</label>
                <select required value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className={inputClasses}>
                  {categories.filter((c: string) => c !== 'All').map((c: string) => <option key={c} value={c} className="bg-[#121215]">{c}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={labelClasses}>Price (₹)</label>
                <input required type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})} className={inputClasses} />
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className={labelClasses}>Description</label>
                <textarea rows={2} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className={cn(inputClasses, "resize-none")} placeholder="Briefly describe the dish..." />
              </div>

              <div className="space-y-1.5">
                <label className={labelClasses}>Dietary Alignment</label>
                <div className="flex gap-2">
                  {['veg', 'non-veg'].map(t => (
                    <button key={t} type="button" onClick={() => setFormData({...formData, type: t as any})} className={cn(
                      "flex-1 py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all",
                      formData.type === t ? (t === 'veg' ? "border-green-500 bg-green-500/10 text-green-500" : "border-red-500 bg-red-500/10 text-red-500") : "border-white/5 text-white/20 hover:border-white/10"
                    )}>{t}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                 <label className={labelClasses}>Operational Status</label>
                 <select value={formData.status} onChange={(e: any) => setFormData({...formData, status: e.target.value})} className={inputClasses}>
                    {['Available', 'Out of Stock', 'Seasonal', 'Chef Special', 'Hidden'].map(s => <option key={s} value={s} className="bg-[#121215]">{s}</option>)}
                 </select>
              </div>

              <div className="space-y-1.5">
                <label className={labelClasses}>Prep Time</label>
                <input type="text" value={formData.prepTime} onChange={(e) => setFormData({...formData, prepTime: e.target.value})} className={inputClasses} placeholder="15-20 mins" />
              </div>

              <div className="space-y-1.5 flex items-end">
                <div onClick={() => setFormData({...formData, isRecommended: !formData.isRecommended})} className={cn(
                  "flex-1 flex items-center justify-center gap-2 border rounded-xl cursor-pointer transition-all px-4 py-3",
                  formData.isRecommended ? "border-amber-500 bg-amber-500/10 text-amber-500" : "border-white/5 text-white/10"
                )}>
                   <CheckCircle2 size={14} />
                   <span className="text-[9px] font-black uppercase tracking-widest">Recommended</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <Button onClick={() => onClose()} type="button" className="flex-1 h-12 bg-white/5 hover:bg-white/10 text-white/40 font-black uppercase tracking-widest rounded-xl transition-all">Cancel</Button>
              <Button type="submit" className="flex-[2] h-12 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                <Save size={18} />
                Save Changes
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const LivePreview = ({ items, menuType }: { items: MenuItem[], menuType: string }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-[#0A0A0C] border border-amber-500/20 rounded-[3.5rem] overflow-hidden flex flex-col h-[700px] shadow-[0_30px_100px_rgba(245,158,11,0.1)] relative"
    >
       <div className="p-10 space-y-8 h-full overflow-y-auto no-scrollbar">
          <div className="text-center space-y-4 py-10">
             <div className="w-16 h-16 mx-auto bg-amber-500 rounded-full flex items-center justify-center text-black">
               {menuType === 'dine-in' ? <UtensilsCrossed size={32} /> : <Coffee size={32} />}
             </div>
             <div>
               <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">The Chef's Log</h3>
               <p className="text-amber-500/60 text-[10px] font-black uppercase tracking-[0.4em] mt-2">{menuType} Experience</p>
             </div>
          </div>

          {['Starters', 'Main Course', 'Dessert', 'Drinks', 'Snacks', 'Tea'].map(cat => {
            const catItems = items.filter(i => i.category === cat);
            if (catItems.length === 0) return null;
            return (
              <div key={cat} className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="h-px flex-1 bg-white/5" />
                   <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">{cat}</h4>
                   <div className="h-px flex-1 bg-white/5" />
                </div>
                <div className="space-y-8">
                   {catItems.map(item => (
                     <div key={item.id} className="flex justify-between items-start gap-6 border-b border-dashed border-white/10 pb-4">
                        <div className="space-y-1">
                           <div className="flex items-center gap-3">
                              <span className="text-sm font-black text-white uppercase tracking-tight">{item.name}</span>
                              {item.type === 'veg' ? <div className="w-2 h-2 rounded-full bg-green-500" /> : <div className="w-2 h-2 rounded-full bg-red-500" />}
                           </div>
                           <p className="text-[10px] text-white/40 leading-relaxed italic">{item.description}</p>
                        </div>
                        <span className="text-lg font-black text-amber-500 font-mono leading-none">₹{item.price}</span>
                     </div>
                   ))}
                </div>
              </div>
            );
          })}
       </div>
       <div className="p-8 bg-amber-500 text-black text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Customer Facing View</span>
       </div>
    </motion.div>
  );
};

export default MenuManagement;

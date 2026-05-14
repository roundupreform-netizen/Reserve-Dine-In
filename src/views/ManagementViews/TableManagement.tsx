import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Grid3X3, 
  Layers, 
  Home, 
  Users, 
  Save, 
  X,
  Lock,
  Search,
  MoreVertical,
  PlusCircle,
  Layout,
  Sparkles,
  Maximize2,
  FileUp,
  History
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import TableLayoutUpload from '../../components/management/TableLayoutUpload';
import FloorPlanEditor, { LayoutTable } from '../../components/management/FloorPlanEditor';
import { DetectedTable } from '../../services/aiLayoutService';

const TableManagement = () => {
  const { user, userData } = useAuth();
  const [sections, setSections] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [halls, setHalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sections' | 'tables' | 'halls'>('sections');
  
  // Advanced Layout features
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeLayoutTables, setActiveLayoutTables] = useState<LayoutTable[]>([]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: 0,
    sectionId: '',
    hallId: '',
    basePrice: 0
  });

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    let sectionsLoaded = false;
    let tablesLoaded = false;
    let hallsLoaded = false;

    const checkLoading = () => {
      if (sectionsLoaded && tablesLoaded && hallsLoaded) {
        setLoading(false);
      }
    };

    const unsubSections = onSnapshot(collection(db, 'sections'), (snap) => {
      setSections(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      sectionsLoaded = true;
      checkLoading();
    }, (error) => {
      console.warn("Sections load failed:", error.message);
      sectionsLoaded = true;
      checkLoading();
    });

    const unsubTables = onSnapshot(collection(db, 'tables'), (snap) => {
      setTables(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      tablesLoaded = true;
      checkLoading();
    }, (error) => {
      console.warn("Tables load failed:", error.message);
      tablesLoaded = true;
      checkLoading();
    });

    const unsubHalls = onSnapshot(collection(db, 'halls'), (snap) => {
      setHalls(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      hallsLoaded = true;
      checkLoading();
    }, (error) => {
      console.warn("Halls load failed:", error.message);
      hallsLoaded = true;
      checkLoading();
    });

    // Fallback if snapshots don't fire quickly
    const timeout = setTimeout(() => setLoading(false), 2000);

    return () => {
      unsubSections();
      unsubTables();
      unsubHalls();
      clearTimeout(timeout);
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const collectionName = activeTab;
    try {
      const data = {
        ...formData,
        updatedAt: serverTimestamp(),
        restaurantId: userData?.restaurantId || 'main-outlet'
      };

      if (editingItem) {
        await updateDoc(doc(db, collectionName, editingItem.id), data);
        toast.success(`${activeTab.slice(0, -1)} updated successfully`);
      } else {
        await addDoc(collection(db, collectionName), {
          ...data,
          createdAt: serverTimestamp()
        });
        toast.success(`New ${activeTab.slice(0, -1)} added`);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({ name: '', capacity: 0, sectionId: '', hallId: '', basePrice: 0 });
    } catch (error) {
      console.error("Error submitting:", error);
      toast.error(`Failed to save ${activeTab.slice(0, -1)}`);
      handleFirestoreError(error, OperationType.WRITE, collectionName);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure? This cannot be undone.")) {
      try {
        await deleteDoc(doc(db, activeTab, id));
        toast.success(`${activeTab.slice(0, -1)} deleted`);
      } catch (error) {
        toast.error("Failed to delete item");
      }
    }
  };

  const inputClasses = "w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-500/50 outline-none text-white transition-all";
  const labelClasses = "text-[10px] font-black text-white/20 uppercase tracking-widest mb-1.5 block";

  const handleLayoutSave = async (updatedTables: LayoutTable[]) => {
    const batch = writeBatch(db);
    const rid = userData?.restaurantId || 'main-outlet';
    
    try {
      // 1. Create Layout Version Snapshot
      const versionRef = doc(collection(db, 'layout_versions'));
      batch.set(versionRef, {
        name: `Layout ${new Date().toLocaleString()}`,
        snapshot: JSON.stringify(updatedTables),
        isPublished: true,
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
        restaurantId: rid
      });

      // 2. Sync to tables collection
      for (const t of updatedTables) {
        if (t.id.startsWith('new-')) {
          const tableRef = doc(collection(db, 'tables'));
          batch.set(tableRef, {
            ...t,
            id: undefined, // remove temp id
            restaurantId: rid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          const tableRef = doc(db, 'tables', t.id);
          batch.update(tableRef, {
            ...t,
            updatedAt: serverTimestamp()
          });
        }
      }

      await batch.commit();
      toast.success("Restaurant layout published successfully");
    } catch (err) {
      console.error("Layout Save Error:", err);
      toast.error("Failed to publish layout");
    }
  };

  const handleAIData = (detected: DetectedTable[]) => {
    // Convert AI detected tables to layout format
    const tempTables: LayoutTable[] = detected.map((dt, idx) => ({
      id: `new-${idx}-${Date.now()}`,
      name: dt.name,
      capacity: dt.capacity,
      x: 100 + (idx % 5) * 150,
      y: 100 + Math.floor(idx / 5) * 150,
      rotation: 0,
      shape: dt.shape || 'square',
      type: dt.type || 'standard'
    }));
    
    setActiveLayoutTables(tempTables);
    setIsUploadOpen(false);
    setIsEditorOpen(true);
  };

  return (
    <div className="flex-1 p-6 lg:p-12 overflow-y-auto">
      {/* UI Overlays */}
      <AnimatePresence>
        {isUploadOpen && <TableLayoutUpload onDataDetected={handleAIData} onClose={() => setIsUploadOpen(false)} />}
        {isEditorOpen && (
          <FloorPlanEditor 
            tables={activeLayoutTables} 
            onSave={handleLayoutSave} 
            onClose={() => setIsEditorOpen(false)} 
          />
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white">Layout Studio</h1>
            <p className="text-white/40 font-medium">Design your restaurant floor plan and event spaces</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-white/5 p-1 rounded-2xl border border-white/5 flex backdrop-blur-sm">
              {[
                { id: 'sections', label: 'Sections', icon: Layers },
                { id: 'tables', label: 'Tables', icon: Grid3X3 },
                { id: 'halls', label: 'Halls', icon: Home },
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                    activeTab === tab.id ? "bg-white/10 text-white shadow-xl" : "text-white/20 hover:text-white/40"
                  )}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsUploadOpen(true)}
                className="h-12 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white border border-white/5 rounded-xl font-black uppercase tracking-widest px-6"
              >
                <FileUp size={18} className="mr-2" />
                Upload Draft
              </Button>
              <Button
                onClick={() => {
                  setActiveLayoutTables(tables as LayoutTable[]);
                  setIsEditorOpen(true);
                }}
                className="h-12 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white border border-white/5 rounded-xl font-black uppercase tracking-widest px-6"
              >
                <Maximize2 size={18} className="mr-2" />
                Visual Editor
              </Button>
              <div className="h-8 w-px bg-white/5 mx-2 md:block hidden" />
              <Button 
                onClick={() => {
                  setEditingItem(null);
                  setFormData({ name: '', capacity: 0, sectionId: '', hallId: '', basePrice: 0 });
                  setIsModalOpen(true);
                }}
                className="h-12 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest px-8 rounded-xl shrink-0"
              >
                <Plus size={18} className="mr-2" />
                Add New
              </Button>
            </div>
          </div>
        </header>

        {/* List Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[400px]">
          <AnimatePresence mode="popLayout">
            {activeTab === 'sections' && (
              sections.length === 0 && !loading ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                   <Layers size={48} className="text-white/5" />
                   <div className="space-y-1">
                     <p className="text-white font-black uppercase tracking-widest text-sm">No Sections Found</p>
                     <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest leading-loose">
                       Create your first floor section to <br /> start assigning tables
                     </p>
                   </div>
                   <Button 
                     onClick={() => setIsModalOpen(true)}
                     className="mt-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase px-6"
                   >
                     Create First Section
                   </Button>
                </div>
              ) : sections.map((section) => (
                <motion.div 
                  key={section.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative bg-[#121215] border border-white/5 p-6 rounded-[2rem] hover:border-amber-500/20 transition-all overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-white/5 rounded-2xl text-white/40 group-hover:text-amber-500 transition-colors">
                      <Layers size={20} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingItem(section); setFormData(section); setIsModalOpen(true); }} className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-colors">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDelete(section.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-white/20 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">{section.name}</h3>
                      <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-1">
                        {tables.filter(t => t.sectionId === section.id).length} Tables Assigned
                      </p>
                    </div>
                    <div className="h-px w-full bg-white/5" />
                    <div className="flex -space-x-2">
                      {tables.filter(t => t.sectionId === section.id).slice(0, 5).map((t: any) => (
                        <div key={t.id} className="w-8 h-8 rounded-full bg-amber-500/10 border-2 border-[#121215] flex items-center justify-center text-[10px] font-black text-amber-500">
                          {t.name?.[0] || '?'}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500 blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity" />
                </motion.div>
              ))
            )}

            {activeTab === 'tables' && (
              tables.length === 0 && !loading ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                   <Grid3X3 size={48} className="text-white/5" />
                   <div className="space-y-1">
                     <p className="text-white font-black uppercase tracking-widest text-sm">No Tables Registered</p>
                     <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest leading-loose">
                       Register your dining tables to <br /> enable reservation management
                     </p>
                   </div>
                </div>
              ) : tables.map((table) => (
                <motion.div 
                  key={table.id}
                  layout
                  className="bg-[#121215] border border-white/5 p-6 rounded-[2rem] hover:border-amber-500/20 transition-all flex flex-col justify-between min-h-[200px]"
                >
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-white/5 rounded-2xl text-white/40">
                      <Grid3X3 size={20} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingItem(table); setFormData(table); setIsModalOpen(true); }} className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDelete(table.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-white/20 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-black text-white">{table.name}</h3>
                      <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-1">
                        {sections.find(s => s.id === table.sectionId)?.name || 'No Section'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl w-fit">
                      <Users size={12} className="text-amber-500" />
                      <span className="text-[10px] font-black text-white">{table.capacity} PAX</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}

            {activeTab === 'halls' && (
              halls.length === 0 && !loading ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                   <Home size={48} className="text-white/5" />
                   <div className="space-y-1">
                     <p className="text-white font-black uppercase tracking-widest text-sm">No Halls Configured</p>
                     <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest leading-loose">
                       List your grand banquet halls <br /> for event bookings
                     </p>
                   </div>
                </div>
              ) : halls.map((hall) => (
                <motion.div 
                  key={hall.id}
                  layout
                  className="bg-[#121215] border border-white/5 p-8 rounded-[2.5rem] hover:border-amber-500/20 transition-all space-y-6"
                >
                  <div className="flex justify-between items-start">
                    <div className="p-4 bg-amber-500/10 rounded-3xl text-amber-500">
                      <Home size={24} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingItem(hall); setFormData(hall); setIsModalOpen(true); }} className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white">
                        <Edit3 size={18} />
                      </button>
                      <button onClick={() => handleDelete(hall.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-white/20 hover:text-red-500">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase">{hall.name}</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-white/20" />
                        <span className="text-xs font-bold text-white/60">{hall.capacity} Capacity</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="text-xs font-black text-amber-500">₹{hall.basePrice} Base</span>
                    </div>
                  </div>
                  <Button className="w-full h-12 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]">View Schedule</Button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Form Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#121215] border border-white/10 rounded-[2.5rem] p-8 z-[101] shadow-[0_30px_100px_rgba(0,0,0,1)]"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-white">{editingItem ? 'Edit' : 'Add'} {activeTab.slice(0, -1)}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1">
                    <label className={labelClasses}>Name / Identifier</label>
                    <input 
                      autoFocus
                      required
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder={activeTab === 'tables' ? 'e.g. VIP-1' : 'e.g. Rooftop'}
                      className={inputClasses}
                    />
                  </div>

                  {activeTab === 'tables' && (
                    <>
                      <div className="space-y-1">
                        <label className={labelClasses}>Seating Capacity</label>
                        <input 
                          type="number" 
                          value={formData.capacity} 
                          onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                          className={inputClasses}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={labelClasses}>Assign Section</label>
                        <select 
                          value={formData.sectionId} 
                          onChange={(e) => setFormData({...formData, sectionId: e.target.value})}
                          className={inputClasses}
                        >
                          <option value="">Select Section</option>
                          {sections.map(s => <option key={s.id} value={s.id} className="bg-[#121215]">{s.name}</option>)}
                        </select>
                      </div>
                    </>
                  )}

                  {activeTab === 'halls' && (
                    <>
                      <div className="space-y-1">
                        <label className={labelClasses}>Max Capacity</label>
                        <input 
                          type="number" 
                          value={formData.capacity} 
                          onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                          className={inputClasses}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={labelClasses}>Base Booking Price (₹)</label>
                        <input 
                          type="number" 
                          value={formData.basePrice} 
                          onChange={(e) => setFormData({...formData, basePrice: parseInt(e.target.value)})}
                          className={inputClasses}
                        />
                      </div>
                    </>
                  )}

                  <Button type="submit" className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest rounded-2xl text-xs mt-4">
                    <Save size={18} className="mr-2" />
                    Save Entity
                  </Button>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TableManagement;

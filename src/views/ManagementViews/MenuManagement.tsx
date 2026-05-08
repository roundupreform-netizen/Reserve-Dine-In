import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Tag
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

const MenuManagement = () => {
  const { user, userData } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuType, setMenuType] = useState<'dine-in' | 'high-tea'>('dine-in');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: 0,
    image: '',
    isAvailable: true,
    type: 'veg',
    menuType: 'dine-in'
  });

  const categories = menuType === 'dine-in' 
    ? ['All', 'Starters', 'Main Course', 'Dessert', 'Drinks', 'Beverages']
    : ['All', 'Snacks', 'Tea', 'Coffee', 'Desserts', 'Bakery'];

  useEffect(() => {
    if (!user || !userData) return;

    setLoading(true);
    const q = query(collection(db, 'menuItems'));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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

  const resetForm = () => {
    setFormData({
      name: '',
      category: categories[1] || '',
      price: 0,
      image: '',
      isAvailable: true,
      type: 'veg',
      menuType: 'dine-in'
    });
  };

  const filteredItems = items.filter(item => 
    item.menuType === menuType &&
    (activeCategory === 'All' || item.category === activeCategory) &&
    (item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const inputClasses = "w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-500/50 outline-none text-white transition-all";
  const labelClasses = "text-[10px] font-black text-white/20 uppercase tracking-widest mb-1.5 block";

  return (
    <div className="flex-1 p-6 lg:p-12 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white">Menu Designer</h1>
            <p className="text-white/40 font-medium">Manage your {menuType === 'dine-in' ? 'Dine-In' : 'High Tea'} culinary offerings</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/5 p-1 rounded-2xl border border-white/5 flex backdrop-blur-sm">
              <button 
                onClick={() => setMenuType('dine-in')}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                  menuType === 'dine-in' ? "bg-amber-500 text-black shadow-xl" : "text-white/20 hover:text-white/40"
                )}
              >
                <UtensilsCrossed size={14} />
                Dine-In
              </button>
              <button 
                onClick={() => setMenuType('high-tea')}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                  menuType === 'high-tea' ? "bg-amber-500 text-black shadow-xl" : "text-white/20 hover:text-white/40"
                )}
              >
                <Coffee size={14} />
                High Tea
              </button>
            </div>
            <Button 
              onClick={() => { setEditingItem(null); resetForm(); setIsModalOpen(true); }}
              className="h-12 bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest px-8 rounded-xl"
            >
              <Plus size={18} className="mr-2" />
              Add Item
            </Button>
          </div>
        </header>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
            <input 
              type="text" 
              placeholder="Search dishes, drinks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-6 text-sm focus:border-amber-500/30 outline-none text-white transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-6 h-14 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  activeCategory === cat ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-white/5 text-white/20 hover:text-white/40"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid View */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group bg-[#121215] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-amber-500/20 transition-all flex flex-col"
              >
                <div className="relative h-48 bg-white/5">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/10 italic">
                      <ImageIcon size={32} strokeWidth={1} />
                      <span className="text-[10px] uppercase tracking-widest font-black mt-2">No Image</span>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                      item.type === 'veg' ? "border-green-500" : "border-red-500"
                    )}>
                      <div className={cn("w-1.5 h-1.5 rounded-full", item.type === 'veg' ? "bg-green-500" : "bg-red-500")} />
                    </div>
                    {!item.isAvailable && (
                      <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Out of Stock</span>
                    )}
                  </div>
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingItem(item); setFormData(item); setIsModalOpen(true); }} className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-amber-500 hover:text-black transition-all">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => deleteDoc(doc(db, 'menuItems', item.id))} className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-red-500 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{item.category}</p>
                    <h3 className="text-xl font-bold tracking-tight text-white leading-tight">{item.name}</h3>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-2xl font-black text-white tracking-tighter">₹{item.price}</span>
                    <button className={cn(
                      "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                      item.isAvailable ? "bg-white/5 text-white/40 hover:bg-white/10" : "bg-red-500/10 text-red-500"
                    )}>
                      {item.isAvailable ? 'INSTOCK' : 'UNAVAIL.'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Item Modal */}
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
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-[#121215] border border-white/10 rounded-[2.5rem] p-10 z-[101] shadow-[0_30px_100px_rgba(0,0,0,1)]"
              >
                <div className="flex justify-between items-center mb-10">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{editingItem ? 'Update' : 'New'} Dish</h2>
                    <p className="text-xs text-white/40">Enter item details for {menuType === 'dine-in' ? 'Dine-In' : 'High Tea'}</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-8">
                  <div className="col-span-2 space-y-2">
                    <label className={labelClasses}>Item Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={inputClasses}
                      placeholder="e.g. Saffron Butter Chicken"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={labelClasses}>Category</label>
                    <select 
                      required
                      value={formData.category} 
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className={inputClasses}
                    >
                      {categories.filter(c => c !== 'All').map(c => <option key={c} value={c} className="bg-[#121215]">{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className={labelClasses}>Price (₹)</label>
                    <input 
                      required
                      type="number" 
                      value={formData.price} 
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                      className={inputClasses}
                    />
                  </div>

                  <div className="col-span-2 space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <label className={labelClasses}>Dietary Type</label>
                        <div className="flex gap-2">
                          {['veg', 'non-veg'].map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setFormData({...formData, type: t})}
                              className={cn(
                                "flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                                formData.type === t ? (t === 'veg' ? "border-green-500 bg-green-500/10 text-green-500" : "border-red-500 bg-red-500/10 text-red-500") : "border-white/5 text-white/20"
                              )}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className={labelClasses}>Inventory Status</label>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, isAvailable: !formData.isAvailable})}
                          className={cn(
                            "w-full py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                            formData.isAvailable ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-red-500 bg-red-500/10 text-red-500"
                          )}
                        >
                          {formData.isAvailable ? 'Available' : 'Sold Out'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className={labelClasses}>Image URL</label>
                    <input 
                      type="text" 
                      value={formData.image} 
                      onChange={(e) => setFormData({...formData, image: e.target.value})}
                      className={inputClasses}
                      placeholder="https://..."
                    />
                  </div>

                  <Button type="submit" className="col-span-2 h-16 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest rounded-2xl text-xs mt-4">
                    <Save size={18} className="mr-2" />
                    Commit to Menu
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

export default MenuManagement;

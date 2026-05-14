import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  ArrowUpRight, 
  Calendar,
  CheckCircle2,
  Zap,
  Activity,
  Star,
  Plus,
  Utensils as UtensilsIcon,
  Coffee,
  ShoppingBag,
  Truck,
  GripVertical,
  ChevronRight,
  Crown,
  Cake,
  UserPlus,
  Timer,
  AlertCircle,
  MapPin,
  CreditCard,
  PieChart as PieIcon,
  Search,
  Layout
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { collection, onSnapshot, query, where, Timestamp, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Toast, ToastType } from '../components/ui/Toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, isToday } from 'date-fns';

// --- Types ---
interface Reservation {
  id: string;
  guestName: string;
  phone: string;
  guests: number;
  date: string;
  time: string;
  session: string;
  status: 'Pending' | 'Confirmed' | 'Arrived' | 'Seated' | 'Dining' | 'Completed' | 'Cancelled' | 'Postponed' | 'No Show' | 'VIP';
  tableId?: string;
  serviceType?: 'dine-in' | 'takeaway' | 'delivery' | 'high-tea';
  preorderItems?: any[];
  specialOccasion?: string;
  isFrequent?: boolean;
}

// --- Helper Components ---

const GlassCard = ({ children, className, onClick, gradient = false }: { children: React.ReactNode, className?: string, onClick?: () => void, gradient?: boolean }) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.01 }}
    onClick={onClick}
    className={cn(
      "relative p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-xl overflow-hidden group transition-all duration-500 cursor-pointer",
      gradient ? "bg-gradient-to-br from-emerald-500/10 to-transparent" : "bg-white/[0.02]",
      className
    )}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

const LiveStatus = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5 backdrop-blur-xl group">
        <Calendar size={18} className="text-blue-500" />
        <div className="flex flex-col">
          <span className="text-xl font-black tabular-nums tracking-tighter text-white">
            {now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/60 font-mono">Current Logic Date</span>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5 backdrop-blur-xl group">
        <Timer size={18} className="text-emerald-500 animate-pulse" />
        <div className="flex flex-col">
          <span className="text-xl font-black tabular-nums tracking-tighter text-white">
            {now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 font-mono">Live Engine Time</span>
        </div>
      </div>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children, icon: Icon }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md" 
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl bg-[#0F0F12] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-emerald-500/5 to-transparent">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                <Icon size={24} />
              </div>
              <h2 className="text-2xl font-black tracking-tighter uppercase">{title}</h2>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors">
              <Plus size={24} className="rotate-45" />
            </button>
          </div>
          <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const CircularProgress = ({ value, label, sublabel }: any) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-white/[0.02] border border-white/5 rounded-[2rem]">
      <svg className="w-32 h-32 transform -rotate-90">
        <circle cx="64" cy="64" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
        <motion.circle 
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          cx="64" cy="64" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" 
          strokeDasharray={circumference} className="text-emerald-500" strokeLinecap="round" 
        />
      </svg>
      <div className="absolute top-[45px] flex flex-col items-center">
        <span className="text-2xl font-black tracking-tighter">{value}%</span>
      </div>
      <div className="mt-4 text-center">
        <p className="text-xs font-black uppercase tracking-widest text-white/80">{label}</p>
        <p className="text-[10px] text-white/40 uppercase tracking-widest">{sublabel}</p>
      </div>
    </div>
  );
};

// --- Main View ---

const DashboardView = ({ onNavigate, onNewReservation, selectedDate, setSelectedDate }: { 
  onNavigate?: (item: any) => void, 
  onNewReservation?: () => void,
  selectedDate: Date,
  setSelectedDate: (date: Date) => void
}) => {
  const { user, userData } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [crmSearch, setCrmSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Active');
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  });

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type, visible: true });
  };
  
  const todayStr = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);

  useEffect(() => {
    if (!user) return;
    const unsubRes = onSnapshot(collection(db, 'reservations'), (snap) => {
      setReservations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'reservations'));

    const unsubTables = onSnapshot(collection(db, 'tables'), (snap) => {
      setTables(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tables'));

    return () => {
      unsubRes();
      unsubTables();
    };
  }, [user]);

  const stats = useMemo(() => {
    const today = reservations.filter(r => r.date === todayStr);
    const preorders = today.filter(r => r.preorderItems && r.preorderItems.length > 0);
    const takeaway = today.filter(r => r.serviceType === 'takeaway' || (!r.serviceType && r.session === 'Takeaway')); 
    const delivery = today.filter(r => r.serviceType === 'delivery');
    const highTea = today.filter(r => r.session === 'Snacks' || r.session === 'High Tea');
    
    // Dynamic occupancy based on actual tables
    const tableCount = tables.length || 24; // fallback 24
    const diningNow = today.filter(r => ['Arrived', 'Seated', 'Dining'].includes(r.status));
    const occupancy = Math.min(100, Math.round((diningNow.length / tableCount) * 100));

    const sessions: Record<string, Reservation[]> = {
      Breakfast: today.filter(r => r.session === 'Breakfast'),
      Lunch: today.filter(r => r.session === 'Lunch'),
      HighTea: today.filter(r => r.session === 'Snacks' || r.session === 'High Tea'),
      Dinner: today.filter(r => r.session === 'Dinner'),
      Evening: today.filter(r => r.session === 'Evening' || r.session === 'Snacks'),
    };

    return { 
      today, 
      preorders, 
      takeaway, 
      delivery, 
      highTea, 
      occupancy,
      sessions
    };
  }, [reservations, todayStr]);

  const upcoming = useMemo(() => {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(); dayAfter.setDate(dayAfter.getDate() + 2);
    const tmoStr = tomorrow.toISOString().split('T')[0];
    const datStr = dayAfter.toISOString().split('T')[0];
    
    return reservations
      .filter(r => r.date === tmoStr || r.date === datStr)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });
  }, [reservations]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const peakData = useMemo(() => {
    const hours = ['11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
    return hours.map(h => ({
      name: h,
      bookings: stats.today.filter(r => r.time.startsWith(h.split(':')[0])).length,
      guests: stats.today.filter(r => r.time.startsWith(h.split(':')[0])).reduce((acc, r) => acc + r.guests, 0)
    }));
  }, [stats.today]);

  const sourceData = [
    { name: 'Online', value: 45, color: '#10b981' },
    { name: 'Walk-in', value: 25, color: '#3b82f6' },
    { name: 'Phone', value: 20, color: '#f59e0b' },
    { name: 'Hotel Guest', value: 10, color: '#8b5cf6' }
  ];

  const updateReservationStatus = async (resId: string, newStatus: string) => {
    try {
      const res = reservations.find(r => r.id === resId);
      const timestampField = 
        newStatus === 'Arrived' ? 'arrivedAt' :
        newStatus === 'Seated' ? 'seatedAt' :
        newStatus === 'Dining' ? 'diningAt' :
        newStatus === 'Completed' ? 'completedAt' : null;

      const updates: any = { 
        status: newStatus,
        updatedAt: serverTimestamp()
      };

      if (timestampField) {
        updates[`timestamps.${timestampField}`] = new Date().toISOString();
      }

      // Append to history if it exists or create it
      const historyEntry = { action: `Status changed to ${newStatus}`, timestamp: new Date().toISOString() };
      const currentHistory = (res as any)?.history || [];
      updates.history = [...currentHistory, historyEntry];

      await updateDoc(doc(db, 'reservations', resId), updates);
      showToast(`Reservation moved to ${newStatus}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reservations/${resId}`);
      showToast('Status update failed', 'error');
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex-1 p-6 lg:p-12 overflow-y-auto no-scrollbar relative min-h-screen bg-[#0A0A0C]">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[150px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[150px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="space-y-2">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="text-5xl font-black tracking-tighter text-white"
            >
              {greeting}, <span className="text-emerald-500">{userData?.displayName?.split(' ')[0] || 'Partner'}</span>
            </motion.h1>
            <div className="flex flex-col gap-1">
              <p className="text-white/40 text-lg font-medium">Here's what's happening for your selected date.</p>
              <div className="flex items-center gap-3 mt-4">
                <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
                  <Calendar size={14} className="text-amber-500" />
                  <span className="text-xs font-black text-amber-500 uppercase tracking-widest leading-none">
                     Log View: {format(selectedDate, 'dd MMMM yyyy')}
                  </span>
                </div>
                {!isToday(selectedDate) && (
                  <button 
                    onClick={() => setSelectedDate(new Date())}
                    className="text-[10px] font-black text-white/20 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1 group"
                  >
                    Switch to Today
                    <CheckCircle2 size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <LiveStatus />
            <motion.button 
              id="dashboard-new-booking"
              data-8848-id="dashboard-new-booking"
              data-tactical="true"
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(16,185,129,0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={onNewReservation}
              data-tour="new-reservation-btn"
              className="px-8 py-4 bg-emerald-500 text-black rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs flex items-center gap-3 transition-all relative overflow-hidden group shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <Plus size={20} className="stroke-[3] relative z-10" />
              <span className="relative z-10">Add New Reservation</span>
            </motion.button>
          </div>
        </header>

        {/* Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-tour="stats-card">
          <GlassCard onClick={() => setActiveModal('reservations')}>
            <div className="flex flex-col h-full justify-between gap-6">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 ring-1 ring-emerald-500/20">
                  <Activity size={28} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-lg">Live</span>
                  <span className="text-2xl font-black text-white mt-1">{stats.occupancy}%</span>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-black tracking-tighter text-white">{stats.today.length}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Total Reservations Today</p>
                <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${stats.occupancy}%` }} className="h-full bg-emerald-500" />
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard onClick={() => setActiveModal('preorders')}>
            <div className="flex flex-col h-full justify-between gap-6">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 ring-1 ring-amber-500/20">
                  <ShoppingBag size={28} />
                </div>
                <div className="p-1 px-3 bg-white/5 rounded-full backdrop-blur-md">
                   <p className="text-[10px] font-bold text-white/60">₹{(stats.preorders.length * 1250).toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-black tracking-tighter text-white">{stats.preorders.length}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Pre-Orders Today</p>
                <div className="flex gap-1 mt-4">
                  {['P', 'C', 'R'].map((s) => (
                    <div key={s} className="flex-1 h-1 bg-white/5 rounded-full bg-amber-500/20" />
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard onClick={() => setActiveModal('takeaway')}>
            <div className="flex flex-col h-full justify-between gap-6">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 ring-1 ring-blue-500/20">
                  <UtensilsIcon size={28} />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-black tracking-tighter text-white">{stats.takeaway.length}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Takeaway Orders</p>
                <div className="flex items-center gap-2 mt-4">
                   <Clock size={12} className="text-blue-500" />
                   <span className="text-[10px] font-bold text-white/40 uppercase">Next pickup in 12m</span>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard onClick={() => setActiveModal('delivery')}>
            <div className="flex flex-col h-full justify-between gap-6">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 ring-1 ring-purple-500/20">
                  <Truck size={28} />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-black tracking-tighter text-white">{stats.delivery.length}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Delivery Preorders</p>
                <div className="flex items-center gap-2 mt-4">
                   <Activity size={12} className="text-purple-500" />
                   <span className="text-[10px] font-bold text-white/40 uppercase">3 Drivers Active</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Analytics & High Tea */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Peak Hours Chart */}
            <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[3rem] space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Peak Demand Analytics</h3>
                  <p className="text-xs text-white/40">Real-time hourly reservation tracking</p>
                </div>
                <PieIcon className="text-emerald-500 opacity-20" size={40} />
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={peakData}>
                    <defs>
                      <linearGradient id="colorEmerald" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 900}} dy={10} />
                    <YAxis hide />
                    <Tooltip cursor={{ stroke: '#10b981', strokeWidth: 2 }} contentStyle={{backgroundColor: '#0F0F12', border: 'none', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}} />
                    <Area type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorEmerald)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Upcoming Reservations */}
            <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[3rem] space-y-8">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Intelligent Pipeline</h3>
                      <p className="text-xs text-white/40">Upcoming critical bookings for next 48 hours</p>
                    </div>
                  </div>
                  <div className="flex -space-x-4">
                    {[
                      { icon: Crown, id: 'crown' },
                      { icon: Cake, id: 'cake' },
                      { icon: UserPlus, id: 'user-plus' }
                    ].map((item) => (
                      <div key={item.id} className="w-10 h-10 rounded-full bg-[#0A0A0C] border-2 border-white/5 flex items-center justify-center text-emerald-500">
                        <item.icon size={14} />
                      </div>
                    ))}
                  </div>
               </div>

               <div className="space-y-4">
                 {upcoming.slice(0, 4).map((r, i) => (
                   <motion.div 
                     key={r.id}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: i * 0.1 }}
                     className="group flex p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 hover:bg-white/[0.04] transition-all items-center gap-6"
                   >
                     <div className="flex flex-col items-center justify-center min-w-[70px] py-3 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-xs font-black uppercase text-emerald-500">
                          {new Date(r.date).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-xl font-black text-white tracking-tighter">
                          {new Date(r.date).getDate()}
                        </span>
                     </div>
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-white text-lg tracking-tight">{r.guestName}</h4>
                          {r.status === 'VIP' && <Crown size={14} className="text-amber-500" fill="currentColor" />}
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{r.session}</span>
                           <span className="w-1 h-1 rounded-full bg-white/10" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{r.time}</span>
                           <span className="w-1 h-1 rounded-full bg-white/10" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{r.guests} Guests</span>
                        </div>
                     </div>
                     <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full text-white/60">
                          {r.tableId ? `Table ${r.tableId}` : 'Unassigned'}
                        </span>
                     </div>
                     <ChevronRight className="text-white/10 group-hover:text-emerald-500 transition-colors" />
                   </motion.div>
                 ))}
                 {upcoming.length === 0 && (
                   <div className="py-12 text-center bg-white/[0.01] rounded-3xl border border-dashed border-white/5">
                     <Calendar className="mx-auto text-white/10 mb-4" size={48} />
                     <p className="text-white/20 font-black uppercase tracking-widest text-xs">No upcoming forecasts available</p>
                   </div>
                 )}
               </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Table Occupancy Visualization */}
            <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[3rem] space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Live Occupancy</h3>
                  <p className="text-xs text-white/40">Real-time floor state</p>
                </div>
                {tables.length > 0 && (
                  <button 
                    onClick={() => onNavigate?.('management')}
                    className="p-2 hover:bg-white/5 rounded-xl text-white/20 hover:text-emerald-500 transition-colors"
                  >
                    <Layout size={16} />
                  </button>
                )}
              </div>
              
              {tables.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {tables.slice(0, 12).map((t) => {
                    const isOccupied = stats.today.some(r => r.tableId === t.id && ['Arrived', 'Seated', 'Dining'].includes(r.status));
                    const isReserved = stats.today.some(r => r.tableId === t.id && r.status === 'Confirmed');
                    
                    return (
                      <div 
                        key={t.id} 
                        className={cn(
                          "aspect-square rounded-xl flex items-center justify-center text-[8px] font-black transition-all border",
                          isOccupied ? "bg-emerald-500/20 border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]" :
                          isReserved ? "bg-blue-500/10 border-blue-500/30 text-blue-500" :
                          "bg-white/5 border-white/5 text-white/20"
                        )}
                        title={`Table ${t.name} - ${isOccupied ? 'Occupied' : isReserved ? 'Reserved' : 'Available'}`}
                      >
                        {t.name}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <CircularProgress value={stats.occupancy} label="Active Floors" sublabel="Capacity utilized" />
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                  <p className="text-[10px] font-bold text-white/40 uppercase mb-1">Available</p>
                  <p className="text-xl font-black text-emerald-500">
                    {(tables.length || 24) - stats.today.filter(r => ['Arrived', 'Seated', 'Dining'].includes(r.status)).length}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                  <p className="text-[10px] font-bold text-white/40 uppercase mb-1">Reserved</p>
                  <p className="text-xl font-black text-blue-500">
                    {stats.today.filter(r => r.status === 'Confirmed').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Source Analytics */}
            <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[3rem] space-y-8">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Booking Source</h3>
                <p className="text-xs text-white/40">Channel performance</p>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sourceData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {sourceData.map((s) => (
                  <div key={s.name} className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-white/60">{s.name}</span>
                    </div>
                    <span className="text-white">{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* High Tea Promo Card */}
            <div className="relative p-10 rounded-[3rem] overflow-hidden group cursor-pointer bg-gradient-to-br from-purple-500/20 to-transparent border border-purple-500/20">
               <div className="relative z-10 space-y-4">
                 <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <Coffee size={24} />
                 </div>
                 <div>
                    <h4 className="text-2xl font-black text-white tracking-tighter uppercase">High Tea Lounge</h4>
                    <p className="text-xs text-purple-200/40">Exclusive slots available for S4</p>
                 </div>
                 <div className="flex items-center justify-between pt-4">
                    <div className="flex flex-col">
                       <span className="text-lg font-black text-white">{stats.highTea.length}</span>
                       <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Bookings</span>
                    </div>
                    <ChevronRight className="text-white/20 group-hover:translate-x-2 transition-transform" />
                 </div>
               </div>
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                 <Coffee size={80} />
               </div>
            </div>
          </div>
        </div>
        {/* Master Reservation CRM Section */}
        <section className="pt-12 border-t border-white/5 pb-20">
          <div className="flex flex-col lg:flex-row justify-between items-end gap-6 mb-10">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <Users size={20} />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Master CRM Logistics</h2>
              </div>
              <p className="text-white/40 text-sm font-medium">Categorized view of active guest stages</p>
            </div>
            
            <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-xl">
              {['Active', 'Confirmed', 'Dining', 'Completed'].map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={cn(
                    "px-6 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    activeTab === t ? "bg-white/10 text-white shadow-lg" : "text-white/20 hover:text-white/40"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {['Pending', 'Arrived', 'Seated', 'Dining'].map((stage) => (
              <div key={stage} className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">{stage} Cycle</h4>
                  <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                    {stats.today.filter(r => r.status === stage).length}
                  </span>
                </div>
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {stats.today
                      .filter(r => r.status === stage)
                      .map((res) => (
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -10 }}
                          key={res.id}
                          className="bg-[#0F0F12] border border-white/5 p-5 rounded-[2rem] group hover:border-emerald-500/20 hover:bg-white/[0.04] transition-all"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 font-black">
                                {res.guestName[0]}
                              </div>
                              <div>
                                <h5 className="text-sm font-black text-white">{res.guestName}</h5>
                                <p className="text-[10px] text-white/20 font-bold">{res.time}</p>
                              </div>
                            </div>
                            {res.status === 'VIP' && <Crown size={14} className="text-amber-500" fill="currentColor" />}
                          </div>

                          <div className="flex items-center justify-between text-white/40 text-[10px] font-black uppercase tracking-widest mb-4">
                            <div className="flex items-center gap-2">
                              <Users size={12} /> {res.guests} PAX
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin size={12} /> {res.tableId ? `T-${res.tableId}` : 'NONE'}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {stage === 'Pending' && (
                              <button 
                                onClick={() => updateReservationStatus(res.id, 'Arrived')}
                                className="flex-1 h-9 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                              >
                                Arrival
                              </button>
                            )}
                            {stage === 'Arrived' && (
                              <button 
                                onClick={() => updateReservationStatus(res.id, 'Seated')}
                                className="flex-1 h-9 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                              >
                                Seating
                              </button>
                            )}
                            {stage === 'Seated' && (
                              <button 
                                onClick={() => updateReservationStatus(res.id, 'Dining')}
                                className="flex-1 h-9 bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                              >
                                dining
                              </button>
                            )}
                            {stage === 'Dining' && (
                              <button 
                                onClick={() => updateReservationStatus(res.id, 'Completed')}
                                className="flex-1 h-9 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                              >
                                Complete
                              </button>
                            )}
                            <button 
                              onClick={() => onNavigate?.('reservations')}
                              className="w-9 h-9 bg-white/5 hover:bg-white/10 text-white/40 flex items-center justify-center rounded-xl transition-all"
                            >
                              <GripVertical size={14} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                  </AnimatePresence>
                  {stats.today.filter(r => r.status === stage).length === 0 && (
                    <div className="py-8 text-center border border-dashed border-white/5 rounded-[2rem]">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/10">Cycle Empty</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 overflow-x-auto bg-[#0F0F12] border border-white/5 rounded-[3rem] shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01]">
                  <th className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Guest Dimension</th>
                  <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Schedule</th>
                  <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">CRM Status</th>
                  <th className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.today.filter(r => {
                  const matchesSearch = r.guestName?.toLowerCase().includes(crmSearch.toLowerCase()) || r.phone?.includes(crmSearch);
                  if (activeTab === 'Active') return matchesSearch && !['Completed', 'Cancelled'].includes(r.status);
                  return matchesSearch && r.status === activeTab;
                }).slice(0, 10).map((res) => (
                  <tr key={res.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center text-white/20 font-black",
                          res.status === 'VIP' ? "bg-purple-500/10 text-purple-500" : "bg-white/5"
                        )}>
                          {res.guestName[0]}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">{res.guestName}</h4>
                          <p className="text-[10px] text-white/20 uppercase tracking-widest">{res.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-white/80 text-xs font-black">
                          <Clock size={12} className="text-emerald-500" />
                          {res.time}
                        </div>
                        <div className="text-[9px] text-white/20 font-black uppercase tracking-widest">{res.session}</div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <div className={cn(
                        "inline-flex items-center px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                        res.status === 'Confirmed' ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" :
                        res.status === 'Pending' ? "text-amber-500 bg-amber-500/10 border-amber-500/20" :
                        res.status === 'Arrived' ? "text-blue-500 bg-blue-500/10 border-blue-500/20" :
                        res.status === 'Seated' ? "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" :
                        res.status === 'Dining' ? "text-pink-500 bg-pink-500/10 border-pink-500/20 animate-pulse" :
                        res.status === 'VIP' ? "text-purple-500 bg-purple-500/20 border-purple-500/30" :
                        res.status === 'Completed' ? "text-white/20 bg-white/5 border-white/5" :
                        res.status === 'Cancelled' ? "text-red-500 bg-red-500/10 border-red-500/20" :
                        "text-white/40 bg-white/5 border-white/5"
                      )}>
                        <div className={cn(
                          "w-1 h-1 rounded-full mr-2", 
                          res.status === 'Dining' ? "bg-pink-500 animate-ping" : 
                          res.status === 'Confirmed' ? "bg-emerald-500 animate-pulse" :
                          "bg-current"
                        )} />
                        {res.status}
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <button 
                        onClick={() => updateReservationStatus(res.id, 'Completed')}
                        className="px-6 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:text-black text-emerald-500 text-[9px] font-black uppercase tracking-widest transition-all"
                      >
                        Settle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.visible} 
        onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
      />

      {/* --- Modals --- */}
      
      <Modal 
        isOpen={activeModal === 'reservations'} 
        onClose={() => setActiveModal(null)}
        title="Reservations Summary"
        icon={Users}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(Object.entries(stats.sessions) as [string, Reservation[]][]).map(([name, res]) => (
            <div key={name} className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-6">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-black uppercase tracking-tight text-white/90">{name}</h4>
                <div className="px-2 py-1 bg-white/5 rounded text-[10px] font-black text-emerald-500">Live</div>
              </div>
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <p className="text-3xl font-black text-white">{res.length}</p>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Bookings</p>
                 </div>
                 <div className="text-right space-y-1">
                    <p className="text-lg font-black text-emerald-500">{res.reduce((a, b) => a + b.guests, 0)}</p>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Total Guests</p>
                 </div>
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                   <span>Occupancy</span>
                   <span>{Math.min(100, Math.round((res.length / 5) * 100))}%</span>
                 </div>
                 <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (res.length / 5) * 100)}%` }} />
                 </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal 
        isOpen={activeModal === 'preorders'} 
        onClose={() => setActiveModal(null)}
        title="Pre-Order Console"
        icon={ShoppingBag}
      >
        <div className="space-y-4">
          {stats.preorders.map((r) => (
            <div key={r.id} className="p-6 rounded-3xl bg-white/5 border border-white/5 flex flex-wrap lg:flex-nowrap gap-8 items-start">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-black">
                     {r.guestName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-white">{r.guestName}</h4>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Table {r.tableId || 'TBD'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.preorderItems?.map((item, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white/60">
                      {item.name} × {item.quantity}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-4 min-w-[200px]">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-emerald-500 text-black rounded-full">Confirmed</span>
                <div className="text-right">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Pickup Time</p>
                  <p className="text-lg font-black text-white">{r.time}</p>
                </div>
              </div>
            </div>
          ))}
          {stats.preorders.length === 0 && (
             <div className="py-24 text-center">
                <ShoppingBag className="mx-auto text-white/5 mb-6" size={64} />
                <p className="text-white/20 font-black uppercase tracking-widest text-sm">No active pre-orders for today's engine cycle</p>
             </div>
          )}
        </div>
      </Modal>

      <Modal 
        isOpen={activeModal === 'takeaway'} 
        onClose={() => setActiveModal(null)}
        title="Takeaway Tracker"
        icon={UtensilsIcon}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.takeaway.map(r => (
            <div key={r.id} className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-black text-white">{r.guestName}</h4>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase rounded-lg">Preparing</span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] text-white/40 font-bold uppercase tracking-widest">
                   <span>Progress</span>
                   <span>12 mins rem.</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                   <motion.div initial={{ width: "30%" }} animate={{ width: "65%" }} className="h-full bg-blue-500" />
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Slot: {r.time}</span>
                <button className="text-[10px] font-black text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest underline">Order Summary</button>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal 
        isOpen={activeModal === 'delivery'} 
        onClose={() => setActiveModal(null)}
        title="Delivery Logistics"
        icon={Truck}
      >
        <div className="space-y-6">
          {stats.delivery.map(r => (
            <div key={r.id} className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-8">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-white">{r.guestName}</h4>
                    <p className="text-xs text-white/40 flex items-center gap-2 mt-1">
                      <MapPin size={12} /> HSR Layout, Sector 7
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full text-purple-400 border border-purple-500/20 mb-2">In Transit</span>
                   <p className="text-xs font-bold text-white/60">Dispatcher ID: #6622</p>
                </div>
              </div>
              
              <div className="relative">
                <div className="h-0.5 w-full bg-white/5 absolute top-1/2 -translate-y-1/2" />
                <div className="relative flex justify-between">
                  {[
                    { label: 'Confirmed', id: 'confirmed', done: true },
                    { label: 'Out for Delivery', id: 'out-for-delivery', done: true },
                    { label: 'Arriving', id: 'arriving', done: false }
                  ].map((step) => (
                    <div key={step.id} className="flex flex-col items-center gap-2 relative z-10">
                      <div className={cn("w-4 h-4 rounded-full", step.done ? "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" : "bg-white/10")} />
                      <span className={cn("text-[8px] font-black uppercase tracking-widest", step.done ? "text-white" : "text-white/20")}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default DashboardView;

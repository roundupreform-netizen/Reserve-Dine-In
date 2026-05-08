import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  CheckCircle2,
  Zap,
  Activity,
  Star,
  Plus,
  Utensils,
  Coffee,
  ShoppingBag,
  Truck,
  GripVertical
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { collection, query, onSnapshot, getDocs, where } from 'firebase/firestore';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const DashboardView = ({ onNavigate, onNewReservation }: { onNavigate?: (item: any) => void, onNewReservation?: () => void }) => {
  const { user, userData } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeGuests: 0,
    occupancyRate: 0,
    dailyRevenue: 54200
  });
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 17) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    };
    updateGreeting();
  }, []);

  useEffect(() => {
    if (!user || !userData) return;
    setLoading(true);

    const unsubRes = onSnapshot(collection(db, 'reservations'), (snap) => {
      const res = snap.docs.map(d => d.data());
      const active = res.filter(r => r.status === 'seated').length;
      setStats(prev => ({
        ...prev,
        totalBookings: res.length,
        activeGuests: active,
        occupancyRate: Math.round((active / 24) * 100) // Assuming 24 tables for demo
      }));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reservations');
    });
    return unsubRes;
  }, [user, userData]);

  const data = [
    { name: '08 AM', count: 12, rev: 4500 },
    { name: '10 AM', count: 18, rev: 8200 },
    { name: '12 PM', count: 45, rev: 15600 },
    { name: '02 PM', count: 32, rev: 12000 },
    { name: '04 PM', count: 25, rev: 8900 },
    { name: '06 PM', count: 52, rev: 22000 },
    { name: '08 PM', count: 65, rev: 31000 },
    { name: '10 PM', count: 38, rev: 14000 },
  ];

  const mainStats = [
    { label: 'Total Volume', value: stats.totalBookings, trend: '+18%', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Live Seating', value: stats.activeGuests, trend: '+5%', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Occupancy', value: `${stats.occupancyRate}%`, trend: '-2%', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Gross Revenue', value: `₹${(stats.dailyRevenue / 1000).toFixed(1)}k`, trend: '+22%', icon: Star, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ];

  return (
    <div className="flex-1 p-6 lg:p-12 overflow-y-auto no-scrollbar relative min-h-screen">
      {/* Floating Action Button for Mobile/Quick Access */}
      <button 
        onClick={() => onNewReservation?.()}
        className="fixed bottom-8 right-8 w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center text-black shadow-[0_10px_30px_rgba(245,158,11,0.4)] md:hidden z-50 transform active:scale-95 transition-all"
      >
        <Plus size={32} className="stroke-[3]" />
      </button>

      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white">
              {greeting}, <span className="text-amber-500">{userData?.displayName?.split(' ')[0] || 'Partner'}</span>
            </h1>
            <p className="text-white/40 font-medium">Here's what's happening at your outlet today</p>
          </div>
          <div className="flex gap-4">
             <button 
                onClick={() => onNewReservation?.()}
                className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-3 rounded-2xl flex items-center gap-3 transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(245,158,11,0.3)] group"
             >
                <Plus size={20} className="stroke-[3]" />
                <span className="text-xs font-black uppercase tracking-widest">New Reservation</span>
             </button>
             <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-3 backdrop-blur-sm hidden sm:flex">
                <Calendar size={16} className="text-amber-500" />
                <span className="text-xs font-black uppercase tracking-widest text-white/80">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                </span>
             </div>
          </div>
        </header>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainStats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#121215] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-white/10 transition-colors"
            >
              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                    <stat.icon size={24} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest",
                    stat.trend.startsWith('+') ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
                  )}>
                    {stat.trend}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-black text-white tracking-tighter leading-none">{stat.value}</h3>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white blur-[100px] opacity-0 group-hover:opacity-5 transition-opacity" />
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#121215] border border-white/5 p-10 rounded-[3rem] space-y-8 min-w-0">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Revenue Velocity</h3>
                  <p className="text-xs text-white/40">Hourly earnings across all outlets</p>
                </div>
                <div className="flex bg-white/5 p-1 rounded-xl">
                   <button className="px-4 py-1.5 rounded-lg text-[9px] font-black uppercase text-amber-500 bg-amber-500/10">Dynamic</button>
                   <button className="px-4 py-1.5 rounded-lg text-[9px] font-black uppercase text-white/20 hover:text-white/40">Static</button>
                </div>
              </div>
              <div className="h-[300px] w-full min-h-[300px] relative">
                <ResponsiveContainer width="99%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 900}} 
                      dy={15}
                    />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#121215', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff'}}
                      itemStyle={{fontWeight: 900, textTransform: 'uppercase', fontSize: 10}}
                    />
                    <Area type="monotone" dataKey="rev" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Today's Agenda - New Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Reservations by Timeframe */}
              <div className="bg-[#121215] border border-white/5 p-8 rounded-[2.5rem] space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <Utensils size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight text-white/90">Daily Reservations</h4>
                      <p className="text-[10px] text-emerald-500 font-bold">Today's Seating</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { slot: 'Lunch (12:00 - 15:00)', count: 12, tables: 4, next: '12:30 PM' },
                    { slot: 'Dinner (19:00 - 23:00)', count: 45, tables: 18, next: '07:00 PM' }
                  ].map((item, i) => (
                    <div key={i} className="group p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-amber-500/20 transition-all">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{item.slot}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-amber-500">{item.count} Guests</span>
                           <div className="w-1 h-1 rounded-full bg-white/20" />
                           <span className="text-[10px] font-black text-white/60">{item.tables} Tables</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="flex -space-x-2">
                          {[1,2,3,4].map(j => (
                            <div key={j} className="w-6 h-6 rounded-full border-2 border-[#121215] bg-amber-500 items-center justify-center flex text-[8px] font-black text-black">U{j}</div>
                          ))}
                        </div>
                        <button className="text-[9px] font-black text-white/40 flex items-center gap-1 group-hover:text-amber-500 transition-colors">
                          VIEW ALL <GripVertical size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Orders: High Tea, Takeaway, Delivery */}
              <div className="bg-[#121215] border border-white/5 p-8 rounded-[2.5rem] space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                      <Coffee size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight text-white/90">Special Services</h4>
                      <p className="text-[10px] text-purple-400 font-bold">On-demand volume</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                   {[
                     { label: 'High Teas', count: 8, icon: Coffee, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                     { label: 'Takeaways', count: 14, icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                     { label: 'Deliveries', count: 22, icon: Truck, color: 'text-rose-500', bg: 'bg-rose-500/10' }
                   ].map((item, i) => (
                     <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                       <div className="flex items-center gap-4">
                         <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.bg, item.color)}>
                            <item.icon size={18} />
                         </div>
                         <h5 className="text-[11px] font-black uppercase tracking-widest text-white/60">{item.label}</h5>
                       </div>
                       <span className="text-lg font-black text-white">{item.count}</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#121215] border border-white/5 p-10 rounded-[3rem] flex flex-col justify-between">
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Kitchen Efficiency</h3>
                <p className="text-xs text-white/40">Real-time order prep velocity</p>
              </div>
              <div className="space-y-6">
                {[
                  { label: 'Hot Apps', val: 92, color: 'bg-emerald-500' },
                  { label: 'Main Course', val: 74, color: 'bg-amber-500' },
                  { label: 'High Tea', val: 88, color: 'bg-purple-500' },
                  { label: 'Pastry', val: 65, color: 'bg-blue-500' },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-white/60">{item.label}</span>
                      <span className="text-white">{item.val}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.val}%` }}
                        transition={{ duration: 1.5, delay: i * 0.2 }}
                        className={cn("h-full rounded-full", item.color)} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                   <Zap size={20} fill="currentColor" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">AI Optimizer</p>
                   <p className="text-sm font-bold text-white leading-none">Yield Up +12%</p>
                </div>
              </div>
              <p className="text-[10px] text-white/30 leading-relaxed font-medium">Predicting high seating volume for Dinner (S3). Suggesting 2 extra staff members.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;

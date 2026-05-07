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
  Star
} from 'lucide-react';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
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

const DashboardView = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeGuests: 0,
    occupancyRate: 0,
    dailyRevenue: 54200
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    });
    return unsubRes;
  }, []);

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
    <div className="flex-1 p-6 lg:p-12 overflow-y-auto no-scrollbar">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white">Performance Pulse</h1>
            <p className="text-white/40 font-medium">Real-time restaurant intelligence and financial overview</p>
          </div>
          <div className="flex gap-3">
             <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-3 backdrop-blur-sm">
                <Calendar size={16} className="text-amber-500" />
                <span className="text-xs font-black uppercase tracking-widest text-white/80">Today: May 07, 2026</span>
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
          <div className="lg:col-span-2 bg-[#121215] border border-white/5 p-10 rounded-[3rem] space-y-8 min-w-0">
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

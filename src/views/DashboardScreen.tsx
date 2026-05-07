import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, Calendar, DollarSign, TrendingUp, LayoutDashboard, 
  Settings, LogOut, ChevronRight, Search, Bell, Filter, MapPin, Utensils
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GlassCard, Button, Input, cn } from '../components/ui/core';
import { useAuth } from '../contexts/AuthContext';

const REVENUE_DATA = [
  { name: 'Mon', total: 2400 },
  { name: 'Tue', total: 1398 },
  { name: 'Wed', total: 9800 },
  { name: 'Thu', total: 3908 },
  { name: 'Fri', total: 4800 },
  { name: 'Sat', total: 13200 },
  { name: 'Sun', total: 11000 },
];

const OCCUPANCY_DATA = [
  { name: 'Lunch', value: 45 },
  { name: 'Afternoon', value: 30 },
  { name: 'Happy Hour', value: 65 },
  { name: 'Dinner', value: 95 },
  { name: 'Late Night', value: 40 },
];

const TABLES = [
  { id: 'T1', status: 'occupied', x: 20, y: 20, size: 4 },
  { id: 'T2', status: 'available', x: 20, y: 50, size: 2 },
  { id: 'T3', status: 'reserved', x: 20, y: 80, size: 6 },
  { id: 'T4', status: 'occupied', x: 50, y: 20, size: 4 },
  { id: 'T5', status: 'available', x: 50, y: 50, size: 2 },
  { id: 'T6', status: 'available', x: 50, y: 80, size: 2 },
  { id: 'T7', status: 'occupied', x: 80, y: 20, size: 8 },
  { id: 'T8', status: 'reserved', x: 80, y: 50, size: 4 },
];

import { getRestaurantInsights } from '../services/geminiService';

export default function DashboardScreen() {
  const { logout } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [aiInsight, setAiInsight] = useState<string>("Analyzing floor capacity and bookings...");

  useEffect(() => {
    const q = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReservations(data);
      
      if (data.length > 0) {
        getRestaurantInsights(data).then(setAiInsight);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white flex overflow-hidden">
      {/* Sidebar - Sleek Rail Style */}
      <aside className="w-24 border-r border-white/[0.05] flex flex-col items-center py-10 gap-12 bg-white/[0.02] backdrop-blur-3xl">
        <div className="w-14 h-14 bg-emerald-500 rounded-[1.25rem] flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
          <Utensils size={28} className="text-white" />
        </div>

        <nav className="flex-1 flex flex-col gap-6">
          {[
            { id: 'dashboard', icon: LayoutDashboard },
            { id: 'reservations', icon: Calendar },
            { id: 'tables', icon: MapPin },
            { id: 'settings', icon: Settings },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300",
                activeTab === item.id 
                  ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30" 
                  : "text-white/20 hover:text-white/60 hover:bg-white/5"
              )}
            >
              <item.icon size={24} />
            </button>
          ))}
        </nav>

        <button 
          onClick={logout}
          className="w-12 h-12 flex items-center justify-center rounded-2xl text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={24} />
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-10 flex flex-col gap-10 overflow-y-auto">
        <header className="flex justify-between items-end">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tighter">Reserve Dine In</h1>
            <p className="text-white/40 text-sm font-medium">Dashboard for <span className="text-emerald-400">Everest Developers</span></p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/5 px-5 py-2.5 rounded-full border border-white/10 flex items-center gap-3 shadow-inner">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10B981]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">Live Engine</span>
            </div>
          </div>
        </header>

        {/* Stats Section */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { label: 'Daily Revenue', value: '$4,285', trend: '+12.5%', icon: DollarSign, color: 'emerald' },
            { label: 'Occupancy', value: '82%', trend: '+4.2%', icon: TrendingUp, color: 'emerald' },
            { label: 'Guests', value: '146', trend: 'Of 180', icon: Users, color: 'blue' },
            { label: 'Avg Waiting', value: '14m', trend: '-2.4%', icon: Bell, color: 'purple' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/[0.03] p-8 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all group">
              <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">{stat.label}</p>
              <div className="flex items-baseline gap-3">
                <h2 className="text-4xl font-bold tracking-tight font-mono">{stat.value}</h2>
                <span className={cn(
                  "text-xs font-bold",
                  stat.trend.includes('+') ? 'text-emerald-400' : 'text-white/20'
                )}>{stat.trend}</span>
              </div>
              <div className="mt-6 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_#10B981]" 
                  style={{ width: i === 1 ? '82%' : '60%' }} 
                />
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* AI Insights & Revenue */}
          <GlassCard className="lg:col-span-2 border-white/[0.03] space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  Performance Forecast
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Generated by AI</span>
                </h3>
                <p className="text-sm text-white/40 italic leading-relaxed prose-sm">{aiInsight}</p>
              </div>
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                <button className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-emerald-500 text-white shadow-lg">Weekly</button>
                <button className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white">Monthly</button>
              </div>
            </div>
            
            <div className="h-72 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_DATA}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#121215', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    labelStyle={{ opacity: 0.4 }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#10B981" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={4} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Booking Pulse */}
          <GlassCard className="border-white/[0.03]">
            <h3 className="text-xl font-bold mb-8">Booking Pulse</h3>
            <div className="space-y-5">
              {reservations.map((res) => (
                <div key={res.id} className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-white/[0.02] border border-white/[0.05] hover:border-emerald-500/20 transition-all group cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <Users size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate text-sm">{res.userName || 'Guest'}</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">{res.date} • {res.time}</div>
                  </div>
                  <div className={cn(
                    "px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest",
                    res.status === 'confirmed' ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-white/40"
                  )}>
                    {res.status}
                  </div>
                </div>
              ))}
              {reservations.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-white/5 rounded-full mx-auto mb-4 flex items-center justify-center text-white/10">
                    <Calendar size={32} />
                  </div>
                  <p className="text-xs text-white/20 uppercase tracking-widest font-bold">Awaiting bookings</p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Live Table Map - Matching Sleek Mockup */}
          <GlassCard className="lg:col-span-3 border-white/[0.03] min-h-[500px] relative overflow-hidden flex flex-col p-12">
            <div className="flex justify-between items-center mb-10">
              <div className="space-y-1">
                <h3 className="text-2xl font-bold tracking-tight">Main Floor Mapping</h3>
                <p className="text-white/40 text-sm font-medium">Active monitoring of T1-T12 sectors</p>
              </div>
              <div className="flex gap-8 text-[10px] uppercase tracking-[0.2em] font-bold text-white/20">
                <div className="flex items-center gap-3"><span className="w-2.5 h-2.5 rounded-full border border-white/20" /> Available</div>
                <div className="flex items-center gap-3"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/30" /> Reserved</div>
                <div className="flex items-center gap-3"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10B981]" /> Occupied</div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10 items-center justify-items-center">
              {TABLES.map(table => (
                <motion.div
                  key={table.id}
                  whileHover={{ scale: 1.05, translateY: -5 }}
                  className={cn(
                    "aspect-square w-32 flex flex-col items-center justify-center gap-2 rounded-[2rem] border transition-all duration-500 cursor-pointer",
                    table.status === 'occupied' 
                      ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_15px_40px_rgba(16,185,129,0.3)]" 
                      : table.status === 'reserved' 
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" 
                      : "bg-white/[0.03] border-white/5 text-white/20 hover:border-white/20"
                  )}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{table.id}</span>
                  <Users size={24} />
                  <span className="text-lg font-bold tracking-tighter">{table.size}P</span>
                </motion.div>
              ))}
            </div>
            
            <p className="text-[10px] text-center text-white/10 uppercase tracking-[0.5em] font-bold mt-12">
              Floor Visualization Engine &bull; V2.0
            </p>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}

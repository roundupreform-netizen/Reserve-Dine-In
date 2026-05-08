import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Calendar, GripVertical, Search, Bell, Plus, Clock, 
  LayoutDashboard, Settings, LogOut, Utensils, Phone, User, 
  MapPin, Check, X, Filter
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, setDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GlassCard, Button, Input, cn } from '../components/ui/core';
import { useAuth } from '../contexts/AuthContext';

const SESSIONS = ['Breakfast', 'Lunch', 'Evening', 'Dinner'];

const SECTIONS = [
  { id: 'sec1', name: 'Section 1', description: 'Window Side', tables: [1, 2, 3, 4, 5, 6] },
  { id: 'sec2', name: 'Section 2', description: 'Main Hall', tables: [7, 8, 9, 10, 11, 12, 13, 14] },
  { id: 'sec3', name: 'Section 3', description: 'VIP Terrace', tables: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24] },
];

const TABLE_COUNT = 24; // Total tables in floor plan

import { getRestaurantInsights } from '../services/geminiService';

export default function DashboardScreen() {
  const { user, userData, logout } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState('Evening');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailsModalReservation, setDetailsModalReservation] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'tables' | 'sections' | 'list'>('tables');
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
 
  // Form State
  const [formData, setFormData] = useState({
    guestName: '',
    phone: '',
    guests: 4,
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    session: 'Evening',
    status: 'reserved',
    notes: '',
    reservationType: 'table' as 'table' | 'multi' | 'section',
    sectionId: '',
    tableNumbers: [] as number[],
  });
 
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
 
  useEffect(() => {
    if (!user || !userData) return;
    const q = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReservations(data);
    }, (error) => {
      // It's good to handle errors here too
      console.error("Firestore Error in DashboardScreen:", error);
    });
    return unsubscribe;
  }, [user, userData]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleAddReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const reservationData: any = {
        ...formData,
        createdAt: serverTimestamp()
      };

      // Determine tables to reserve
      let tablesToReserve: number[] = [];
      if (formData.reservationType === 'section') {
        const section = SECTIONS.find(s => s.id === formData.sectionId);
        tablesToReserve = section?.tables || [];
      } else {
        tablesToReserve = formData.tableNumbers;
      }

      if (tablesToReserve.length === 0) {
        alert("Please select at least one table.");
        return;
      }

      // Check conflicts
      const existingRes = reservations.filter(r => 
        r.date === formData.date && 
        r.session === formData.session
      );

      const conflict = existingRes.some(r => {
        const rTables = r.reservationType === 'table' ? [r.tableNumber] : r.tables;
        return rTables.some((t: number) => tablesToReserve.includes(t));
      });

      if (conflict) {
        alert("One or more tables are already reserved for this time/session.");
        return;
      }

      reservationData.tables = tablesToReserve;
      // For backward compatibility
      if (formData.reservationType === 'table') {
        reservationData.tableNumber = tablesToReserve[0];
      }

      await addDoc(collection(db, 'reservations'), reservationData);
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error adding reservation:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      guestName: '',
      phone: '',
      guests: 4,
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
      session: activeSession,
      status: 'reserved',
      notes: '',
      reservationType: 'table',
      sectionId: '',
      tableNumbers: [],
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reserved': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'available': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'occupied': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'VIP': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      default: return 'text-white/40 bg-white/5 border-white/10';
    }
  };

  const formattedDate = currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const formattedTime = currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Generate table status based on current session and filters
  const todayStr = dateFilter;
  
  const filteredReservations = reservations.filter(r => {
    const matchesSearch = r.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         r.phone?.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesSession = r.session === activeSession;
    const matchesDate = r.date === todayStr;
    
    return matchesSearch && matchesStatus && (viewMode === 'list' ? true : (matchesSession && matchesDate));
  });

  const allTables = Array.from({ length: TABLE_COUNT }, (_, i) => {
    const tableNum = i + 1;
    
    // Find if table is reserved (either single or part of section/multi)
    const reservation = reservations.find(r => 
      r.date === todayStr && 
      r.session === activeSession &&
      (statusFilter === 'all' || r.status === statusFilter) &&
      (searchQuery === '' || r.guestName?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (
        (r.reservationType === 'table' && r.tableNumber === tableNum) ||
        ((r.reservationType === 'section' || r.reservationType === 'multi') && r.tables?.includes(tableNum))
      )
    );

    return {
      number: tableNum,
      reservation: reservation || null,
      isSectionReserved: reservation?.reservationType === 'section'
    };
  });

  // Section status
  const sectionsData = SECTIONS.map(sec => {
    const reservation = reservations.find(r => 
      r.reservationType === 'section' &&
      r.sectionId === sec.id &&
      r.date === todayStr && 
      r.session === activeSession
    );

    const tablesInSec = allTables.filter(t => sec.tables.includes(t.number));
    const reservedCount = tablesInSec.filter(t => t.reservation).length;

    return {
      ...sec,
      reservation: reservation || null,
      reservedCount,
      totalTables: sec.tables.length,
      tables: tablesInSec
    };
  });

  const stats = {
    total: reservations.filter(r => r.date === todayStr).length,
    available: allTables.filter(t => !t.reservation).length,
    reserved: reservations.filter(r => r.date === todayStr && r.status === 'reserved').length,
    occupied: reservations.filter(r => r.date === todayStr && r.status === 'occupied').length,
    vip: reservations.filter(r => r.date === todayStr && r.status === 'VIP').length,
    sectionsReserved: sectionsData.filter(s => s.reservation).length
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex overflow-hidden font-sans">
      {/* Sidebar - Ultra Minimal */}
      <aside className="w-20 border-r border-white/[0.03] flex flex-col items-center py-8 gap-10 bg-black/40 backdrop-blur-3xl z-20">
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
          <Utensils size={24} className="text-white" />
        </div>
        <nav className="flex-1 flex flex-col gap-8">
          {[LayoutDashboard, Calendar, MapPin, Users, Settings].map((Icon, i) => (
            <button key={i} className={cn(
              "w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300",
              i === 0 ? "bg-white/5 text-white shadow-xl ring-1 ring-white/10" : "text-white/20 hover:text-white/60"
            )}>
              <Icon size={22} />
            </button>
          ))}
        </nav>
        <button onClick={logout} className="w-12 h-12 flex items-center justify-center text-red-500/40 hover:text-red-500 transition-colors">
          <LogOut size={22} />
        </button>
      </aside>

      <main className="flex-1 p-4 lg:p-12 overflow-y-auto relative h-screen">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4 lg:mb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-0.5">
            <h1 className="text-xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">Dine-In Hub</h1>
            <p className="text-white/20 text-[8px] lg:text-sm font-medium uppercase tracking-widest hidden lg:block">System Online</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/[0.03] border border-white/5 rounded-xl lg:rounded-3xl p-2 lg:p-5 flex items-center gap-4 backdrop-blur-xl w-full md:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-emerald-400 lg:w-[18px] lg:h-[18px]" />
              <span className="text-[10px] lg:text-sm font-mono font-bold text-emerald-400 tracking-wider transition-all duration-500">{formattedTime}</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Calendar size={12} className="text-white/20" />
              <span className="text-[10px] lg:text-sm font-semibold text-white/40">{formattedDate}</span>
            </div>
          </motion.div>
        </header>

        {/* Filters and Title */}
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
            <div className="flex bg-white/[0.02] p-1 rounded-xl border border-white/[0.05] backdrop-blur-sm overflow-x-auto no-scrollbar gap-1 w-full md:w-auto">
              {SESSIONS.map((session) => (
                <button
                  key={session}
                  onClick={() => setActiveSession(session)}
                  className={cn(
                    "px-3 lg:px-6 py-1.5 lg:py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap flex-1 md:flex-none",
                    activeSession === session 
                      ? "bg-emerald-500 text-white shadow-lg" 
                      : "text-white/20 hover:text-white/40"
                  )}
                >
                  {session}
                </button>
              ))}
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <div className="bg-white/[0.02] p-1 rounded-xl border border-white/[0.05] flex backdrop-blur-sm flex-1 md:flex-initial">
                {['tables', 'sections', 'list'].map((mode) => (
                  <button 
                    key={mode}
                    onClick={() => setViewMode(mode as any)}
                    className={cn(
                      "flex-1 md:px-4 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all",
                      viewMode === mode ? "bg-white/10 text-white" : "text-white/20"
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setIsFilterVisible(!isFilterVisible)}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-xl border transition-all",
                  isFilterVisible || searchQuery || statusFilter !== 'all'
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    : "bg-white/5 text-white/40 border-white/10"
                )}
              >
                <Filter size={18} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {(isFilterVisible || searchQuery || statusFilter !== 'all') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 md:p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input 
                      type="text"
                      placeholder="Search guest or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-10 pl-9 pr-4 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:border-emerald-500/50 transition-all outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="flex-1 h-10 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest px-3 outline-none focus:border-emerald-500/50"
                    >
                      <option value="all" className="bg-[#121215]">All Status</option>
                      <option value="reserved" className="bg-[#121215]">Reserved</option>
                      <option value="occupied" className="bg-[#121215]">Occupied</option>
                      <option value="VIP" className="bg-[#121215]">VIP</option>
                    </select>
                    <input 
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="flex-1 h-10 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest px-3 outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setDateFilter(new Date().toISOString().split('T')[0]);
                    }}
                    className="h-10 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    Reset Filters
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats Summary Section - Horizontal Scroll on Mobile */}
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 mb-6">
          <motion.section 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex md:grid md:grid-cols-5 gap-2 min-w-max md:min-w-0 pb-2"
          >
            {[
              { label: 'Tot', value: stats.total, color: 'text-white', bg: 'bg-white/5', icon: Calendar },
              { label: 'Free', value: stats.available, color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: Check },
              { label: 'Res', value: stats.reserved, color: 'text-red-500', bg: 'bg-red-500/10', icon: Clock },
              { label: 'Sec', value: stats.sectionsReserved, color: 'text-orange-500', bg: 'bg-orange-500/10', icon: MapPin },
              { label: 'VIP', value: stats.vip, color: 'text-purple-500', bg: 'bg-purple-500/10', icon: Bell },
            ].map((item, i) => (
              <div key={i} className={cn(
                "p-2 lg:p-6 rounded-xl lg:rounded-[2rem] border border-white/[0.05] flex flex-col justify-between h-14 lg:h-32 w-24 md:w-auto transition-all",
                item.bg
              )}>
                <div className="flex justify-between items-start">
                  <item.icon size={8} className={cn("opacity-40", item.color)} />
                  <span className={cn("text-[7px] font-black uppercase", item.color)}>{item.label}</span>
                </div>
                <h4 className={cn("text-xs lg:text-3xl font-black tracking-tighter leading-none", item.color)}>{item.value}</h4>
              </div>
            ))}
          </motion.section>
        </div>

        {/* Section-wise Grid View */}
        <AnimatePresence mode="wait">
          {viewMode === 'list' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-3"
            >
              {filteredReservations.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-white/10 gap-4">
                  <Search size={48} strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase tracking-widest">No matching reservations</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredReservations.map((res) => (
                    <motion.div
                      key={res.id}
                      onClick={() => setDetailsModalReservation(res)}
                      className={cn(
                        "p-4 rounded-2xl border bg-white/[0.02] border-white/5 hover:border-white/20 transition-all cursor-pointer flex justify-between items-center",
                        res.status === 'VIP' ? "border-purple-500/20 bg-purple-500/[0.02]" :
                        res.status === 'occupied' ? "border-orange-500/20 bg-orange-500/[0.02]" :
                        "border-red-500/20 bg-red-500/[0.02]"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          res.status === 'VIP' ? "bg-purple-500/20 text-purple-500" :
                          res.status === 'occupied' ? "bg-orange-500/20 text-orange-500" :
                          "bg-red-500/20 text-red-500"
                        )}>
                          <User size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold">{res.guestName}</h4>
                          <p className="text-[9px] text-white/40 uppercase tracking-widest font-black">
                            {res.date} • {res.time} • {res.guests} PAX
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                          {res.reservationType === 'section' ? 'ZONE LOCK' : `T-${res.tableNumber || res.tables?.[0]}`}
                        </span>
                        <GripVertical size={14} className="text-white/20" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : viewMode === 'tables' ? (
            <div className="space-y-6 lg:space-y-16">
              {sectionsData.map((section) => (
                <motion.div 
                  key={section.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3 lg:space-y-6"
                >
                  <div className="flex items-end justify-between px-1">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm lg:text-2xl font-black tracking-tighter uppercase">{section.name}</h3>
                        {section.reservation && (
                          <div className="bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded-full border border-red-500/30 flex items-center gap-1">
                            <Lock size={8} fill="currentColor" />
                            <span className="text-[7px] font-black uppercase tracking-widest">Locked</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-[8px] font-bold text-white/10 uppercase tracking-widest">
                      {section.reservedCount}/{section.totalTables} TABLES
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 lg:gap-4">
                    {section.tables.map(({ number, reservation, isSectionReserved }) => (
                      <motion.div
                        key={`table-${number}`}
                        whileHover={{ scale: 0.98 }}
                        onClick={() => {
                          if (reservation) {
                            setDetailsModalReservation(reservation);
                          } else {
                            setFormData(prev => ({ 
                              ...prev, 
                              session: activeSession, 
                              reservationType: 'table',
                              tableNumbers: [number]
                            }));
                            setIsModalOpen(true);
                          }
                        }}
                        className={cn(
                          "group relative p-2 lg:p-6 rounded-xl lg:rounded-[2rem] border transition-all duration-300 cursor-pointer overflow-hidden min-h-[70px] lg:min-h-[180px] flex flex-col justify-between",
                          reservation 
                            ? (reservation.status === 'VIP' ? "bg-purple-500/[0.05] border-purple-500/30 shadow-[0_5px_15px_rgba(168,85,247,0.1)]" :
                               reservation.status === 'occupied' ? "bg-orange-500/[0.05] border-orange-500/30 shadow-[0_5px_15px_rgba(249,115,22,0.1)]" :
                               "bg-red-500/[0.05] border-red-500/30")
                            : "bg-white/[0.02] border-white/5 hover:border-emerald-500/40"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="text-base lg:text-3xl font-black tracking-tighter">T{number}</h4>
                          {reservation && (
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              reservation.status === 'VIP' ? "bg-purple-500 shadow-[0_0_8px_#A855F7]" :
                              reservation.status === 'occupied' ? "bg-orange-500 shadow-[0_0_8px_#F97316]" :
                              "bg-red-500 shadow-[0_0_8px_#EF4444]"
                            )} />
                          )}
                        </div>

                        {reservation ? (
                          <div className="space-y-1 mt-2">
                            <p className="text-[8px] font-bold truncate leading-none text-white/80">{reservation.guestName.split(' ')[0]}</p>
                            <div className="flex items-center gap-1 opacity-40">
                              <Users size={8} />
                              <span className="text-[8px] font-black">{reservation.guests}</span>
                            </div>
                          </div>
                        ) : (
                          <Plus size={12} className="text-white/10 group-hover:text-emerald-500/40 self-end" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {sectionsData.map((section) => (
                <motion.div
                  key={`section-view-${section.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => {
                    if (section.reservation) {
                      setDetailsModalReservation(section.reservation);
                    } else {
                      setFormData(prev => ({ 
                        ...prev, 
                        session: activeSession, 
                        reservationType: 'section',
                        sectionId: section.id,
                        guests: section.totalTables * 4
                      }));
                      setIsModalOpen(true);
                    }
                  }}
                  className={cn(
                    "group relative p-4 lg:p-10 rounded-2xl lg:rounded-[3rem] border transition-all duration-700 cursor-pointer overflow-hidden min-h-[140px] lg:min-h-[300px] flex flex-col justify-between",
                    section.reservation 
                      ? "bg-red-500/[0.03] border-red-500/20 shadow-[0_10px_30px_rgba(239,68,68,0.1)]" 
                      : "bg-white/[0.02] border-white/5 hover:border-emerald-500/30"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-white/20 text-[7px] lg:text-[11px] font-black uppercase tracking-widest">{section.description}</span>
                        <h4 className="text-xl lg:text-5xl font-black tracking-tighter uppercase leading-none">{section.name}</h4>
                      </div>
                      {section.reservation ? (
                        <Lock size={14} className="text-red-500" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <span className="text-[8px] lg:text-xs font-bold text-white/20 uppercase tracking-widest">
                      {section.reservedCount}/{section.totalTables} TABLES
                    </span>
                    {section.reservation ? (
                      <span className="text-[8px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">LOCKED</span>
                    ) : (
                      <button className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Reserve Zone</button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* FAB */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="fixed bottom-10 right-10 w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-[0_15px_40px_rgba(16,185,129,0.5)] z-30 ring-4 ring-emerald-500/20"
        >
          <Plus size={32} />
        </motion.button>

        {/* Create Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-[#121215] rounded-[3rem] border border-white/10 p-8 relative overflow-hidden"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold tracking-tight">Create Reservation</h3>
                  <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleAddReservation} className="space-y-6">
                  <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex">
                    {[
                      { id: 'table', label: 'Single', color: 'bg-emerald-500' },
                      { id: 'multi', label: 'Multiple', color: 'bg-orange-500' },
                      { id: 'section', label: 'Section', color: 'bg-red-500' }
                    ].map(type => (
                      <button 
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({...formData, reservationType: type.id as any})}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                          formData.reservationType === type.id ? `${type.color} text-white` : "text-white/20 hover:text-white/40"
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2 block">Guest Name</label>
                      <Input 
                        placeholder="e.g. Mr. Sharma"
                        required
                        value={formData.guestName}
                        onChange={e => setFormData({...formData, guestName: e.target.value})}
                        className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-emerald-500/50"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2 block">Table Status (Category)</label>
                      <div className="flex gap-2">
                        {['reserved', 'occupied', 'VIP'].map(status => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setFormData({...formData, status: status as any})}
                            className={cn(
                              "flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                              formData.status === status 
                                ? (status === 'reserved' ? "bg-red-500/20 border-red-500 text-red-500" :
                                   status === 'occupied' ? "bg-orange-500/20 border-orange-500 text-orange-500" :
                                   "bg-purple-500/20 border-purple-500 text-purple-500")
                                : "bg-white/5 border-white/10 text-white/20"
                            )}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2 block">Total Guests</label>
                      <Input 
                        type="number"
                        min="1"
                        required
                        value={formData.guests}
                        onChange={e => setFormData({...formData, guests: parseInt(e.target.value)})}
                        className="h-14 bg-white/5 border-white/10 rounded-2xl"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2 block">Arrival Time</label>
                      <Input 
                        type="time"
                        required
                        value={formData.time}
                        onChange={e => setFormData({...formData, time: e.target.value})}
                        className="h-14 bg-white/5 border-white/10 rounded-2xl"
                      />
                    </div>

                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2 block">Date</label>
                        <Input 
                          type="date"
                          required
                          value={formData.date}
                          onChange={e => setFormData({...formData, date: e.target.value})}
                          className="h-14 bg-white/5 border-white/10 rounded-2xl"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2 block">Session</label>
                        <select 
                          value={formData.session}
                          onChange={e => setFormData({...formData, session: e.target.value})}
                          className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {SESSIONS.map(s => <option key={s} value={s} className="bg-[#121215]">{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2 block">
                        {formData.reservationType === 'section' ? 'Select Section' : 'Select Tables'}
                      </label>
                      
                      {formData.reservationType === 'section' ? (
                        <select 
                          required
                          value={formData.sectionId}
                          onChange={e => setFormData({...formData, sectionId: e.target.value})}
                          className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="" disabled className="bg-[#121215]">Choose Area</option>
                          {SECTIONS.map(s => <option key={s.id} value={s.id} className="bg-[#121215]">{s.name}</option>)}
                        </select>
                      ) : (
                        <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map(num => {
                            const isReserved = allTables.find(t => t.number === num)?.reservation;
                            const isSelected = formData.tableNumbers.includes(num);
                            
                            return (
                              <button
                                key={num}
                                type="button"
                                disabled={!!isReserved && !isSelected}
                                onClick={() => {
                                  if (formData.reservationType === 'table') {
                                    setFormData({...formData, tableNumbers: [num]});
                                  } else {
                                    setFormData({
                                      ...formData,
                                      tableNumbers: isSelected 
                                        ? formData.tableNumbers.filter(n => n !== num)
                                        : [...formData.tableNumbers, num]
                                    });
                                  }
                                }}
                                className={cn(
                                  "h-10 rounded-lg text-xs font-bold transition-all",
                                  isSelected ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]" :
                                  isReserved ? "bg-red-500/10 text-red-500/30 cursor-not-allowed border border-red-500/10" :
                                  "bg-white/5 text-white/40 hover:bg-white/10 border border-white/5"
                                )}
                              >
                                {num}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button type="submit" className={cn(
                      "w-full h-16 rounded-3xl font-black tracking-[0.3em] uppercase transition-all duration-500 shadow-2xl",
                      formData.reservationType === 'table' ? "bg-emerald-500" :
                      formData.reservationType === 'multi' ? "bg-orange-500" : "bg-red-500"
                    )}>
                      Post Reservation
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Details Modal */}
        <AnimatePresence>
          {detailsModalReservation && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-[#121215] rounded-[3rem] border border-white/10 p-10 relative"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <span className={cn(
                      "text-[11px] font-bold uppercase tracking-[0.3em] block mb-2",
                      detailsModalReservation.status === 'VIP' ? "text-purple-500" :
                      detailsModalReservation.status === 'occupied' ? "text-orange-500" :
                      "text-red-500"
                    )}>
                      {detailsModalReservation.reservationType === 'section' ? 'Full Area Lockdown' : 
                       detailsModalReservation.reservationType === 'multi' ? 'Multi-Table Booking' : 'Confirmed Reservation'}
                    </span>
                    <h3 className="text-4xl font-black tracking-tighter">
                      {detailsModalReservation.reservationType === 'section' 
                        ? (SECTIONS.find(s => s.id === detailsModalReservation.sectionId)?.name || 'Custom Section')
                        : detailsModalReservation.reservationType === 'multi'
                        ? `${detailsModalReservation.tables?.length} Tables Reserved`
                        : `Table ${detailsModalReservation.tableNumber || detailsModalReservation.tables?.[0]}`}
                    </h3>
                  </div>
                  <button onClick={() => setDetailsModalReservation(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-8">
                  {(detailsModalReservation.reservationType === 'section' || detailsModalReservation.reservationType === 'multi') && (
                    <div className="bg-white/5 border border-white/10 p-5 rounded-3xl space-y-3">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Reserved Tables</p>
                      <div className="flex flex-wrap gap-2">
                        {detailsModalReservation.tables?.map((t: number) => (
                          <div key={t} className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-xs font-bold text-white/60">T-{t}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-white/[0.03] flex items-center justify-center text-white/20 ring-1 ring-white/5">
                      <User size={32} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white/20 uppercase tracking-widest mb-1">Lead Guest</p>
                      <h4 className="text-xl font-bold">{detailsModalReservation.guestName}</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
                        <Users size={12} /> Party Size
                      </p>
                      <p className="text-lg font-bold">{detailsModalReservation.guests} People</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} /> Arrival
                      </p>
                      <p className="text-lg font-bold">{detailsModalReservation.time}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
                        <Phone size={12} /> Contact
                      </p>
                      <p className="text-sm font-bold text-white/60">{detailsModalReservation.phone || 'N/A'}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
                        <Filter size={12} /> Session
                      </p>
                      <p className="text-lg font-bold">{detailsModalReservation.session}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button 
                      className="flex-1 h-16 rounded-[1.25rem] bg-emerald-500 hover:bg-emerald-600 font-bold uppercase tracking-widest"
                      onClick={() => setDetailsModalReservation(null)}
                    >
                      Check-In
                    </Button>
                    <Button 
                      onClick={() => {
                        if (confirm('Delete this reservation?')) {
                          deleteDoc(doc(db, 'reservations', detailsModalReservation.id));
                          setDetailsModalReservation(null);
                        }
                      }}
                      className="w-16 h-16 rounded-[1.25rem] bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-500 transition-all border border-white/10 hover:border-red-500/20"
                    >
                      <X size={24} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

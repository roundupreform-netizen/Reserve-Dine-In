import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Calendar, ChevronRight, Search, Bell, Plus, Clock, 
  LayoutDashboard, Settings, LogOut, Utensils, Phone, User, 
  MapPin, Check, X, Filter
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, setDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GlassCard, Button, Input, cn } from '../components/ui/core';
import { useAuth } from '../contexts/AuthContext';

const SESSIONS = ['Breakfast', 'Lunch', 'Evening', 'Dinner'];

const SECTIONS = [
  { id: 'sec1', name: 'Section 1', description: 'Main Floor Alpha', tables: [1, 2, 3, 4] },
  { id: 'sec2', name: 'Section 2', description: 'Main Floor Beta', tables: [5, 6, 7, 8] },
  { id: 'vip', name: 'VIP Area', description: 'Private Lounge', tables: [9, 10] },
  { id: 'outdoor', name: 'Outdoor Area', description: 'Terrace Garden', tables: [11, 12] },
];

const TABLE_COUNT = 12; // Total tables in floor plan

import { getRestaurantInsights } from '../services/geminiService';

export default function DashboardScreen() {
  const { userData, logout } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState('Evening');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [detailsModalReservation, setDetailsModalReservation] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'tables' | 'sections'>('tables');

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
    reservationType: 'table' as 'table' | 'section',
    sectionId: ''
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReservations(data);
    });
    return unsubscribe;
  }, []);

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

      if (formData.reservationType === 'table') {
        reservationData.tableNumber = selectedTable;
      } else {
        const section = SECTIONS.find(s => s.id === formData.sectionId);
        reservationData.tables = section?.tables || [];
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
      sectionId: ''
    });
    setSelectedTable(null);
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

  // Generate table status based on current session and date
  const todayStr = currentTime.toISOString().split('T')[0];
  
  const tables = Array.from({ length: TABLE_COUNT }, (_, i) => {
    const tableNum = i + 1;
    
    // Find table reservation
    const tableRes = reservations.find(r => 
      r.reservationType === 'table' &&
      r.tableNumber === tableNum && 
      r.date === todayStr && 
      r.session === activeSession
    );

    // Find if table is part of a section reservation
    const sectionRes = reservations.find(r => 
      r.reservationType === 'section' &&
      r.tables?.includes(tableNum) &&
      r.date === todayStr && 
      r.session === activeSession
    );

    return {
      number: tableNum,
      reservation: tableRes || sectionRes || null,
      isSectionReserved: !!sectionRes
    };
  });

  // Section status
  const sections = SECTIONS.map(sec => {
    const reservation = reservations.find(r => 
      r.reservationType === 'section' &&
      r.sectionId === sec.id &&
      r.date === todayStr && 
      r.session === activeSession
    );

    const tablesInSec = tables.filter(t => sec.tables.includes(t.number));
    const reservedCount = tablesInSec.filter(t => t.reservation).length;

    return {
      ...sec,
      reservation: reservation || null,
      reservedCount,
      totalTables: sec.tables.length
    };
  });

  const stats = {
    total: reservations.filter(r => r.date === todayStr).length,
    available: tables.filter(t => !t.reservation).length,
    reserved: reservations.filter(r => r.date === todayStr && r.status === 'reserved').length,
    occupied: reservations.filter(r => r.date === todayStr && r.status === 'occupied').length,
    vip: reservations.filter(r => r.date === todayStr && r.status === 'VIP').length,
    sectionsReserved: sections.filter(s => s.reservation).length
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

      <main className="flex-1 p-8 lg:p-12 overflow-y-auto relative h-screen">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
            <h2 className="text-white/40 text-sm font-medium tracking-wide">Hello, {userData?.displayName?.split(' ')[0] || 'Admin'} 👋</h2>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">{getGreeting()}</h1>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 flex items-center gap-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-emerald-400" />
              <span className="text-sm font-semibold text-white/80">{formattedDate}</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-3 min-w-[100px]">
              <Clock size={18} className="text-emerald-400" />
              <span className="text-sm font-mono font-bold text-emerald-400 tracking-wider transition-all duration-500">{formattedTime}</span>
            </div>
          </motion.div>
        </header>

        {/* Filters and Title */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h3 className="text-2xl font-bold tracking-tight">Today's Reservations</h3>
            {/* Session Selector */}
            <div className="flex bg-white/[0.02] p-1.5 rounded-2xl border border-white/[0.05] backdrop-blur-sm shadow-2xl">
              {SESSIONS.map((session) => (
                <button
                  key={session}
                  onClick={() => setActiveSession(session)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-500",
                    activeSession === session 
                      ? "bg-emerald-500 text-white shadow-[0_10px_25px_rgba(16,185,129,0.3)] scale-105" 
                      : "text-white/30 hover:text-white/60"
                  )}
                >
                  {session}
                </button>
              ))}
            </div>
          </motion.div>

          <div className="flex gap-4">
            <div className="bg-white/[0.02] p-1.5 rounded-2xl border border-white/[0.05] flex backdrop-blur-sm">
              <button 
                onClick={() => setViewMode('tables')}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                  viewMode === 'tables' ? "bg-white/10 text-white shadow-xl" : "text-white/20 hover:text-white/40"
                )}
              >
                Tables
              </button>
              <button 
                onClick={() => setViewMode('sections')}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                  viewMode === 'sections' ? "bg-white/10 text-white shadow-xl" : "text-white/20 hover:text-white/40"
                )}
              >
                Sections
              </button>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl flex items-center gap-4">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_#10B981]" />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                {reservations.filter(r => r.date === todayStr && r.session === activeSession).length} Booked
              </span>
            </div>
          </div>
        </div>

        {/* Stats Summary Section */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10"
        >
          {[
            { label: 'Today Total', value: stats.total, color: 'text-white', bg: 'bg-white/5', icon: Calendar },
            { label: 'Available', value: stats.available, color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: Check },
            { label: 'Reserved', value: stats.reserved, color: 'text-red-500', bg: 'bg-red-500/10', icon: Clock },
            { label: 'Sections', value: stats.sectionsReserved, color: 'text-orange-500', bg: 'bg-orange-500/10', icon: MapPin },
            { label: 'VIP', value: stats.vip, color: 'text-purple-500', bg: 'bg-purple-500/10', icon: Bell },
          ].map((item, i) => (
            <div key={i} className={cn(
              "p-6 rounded-[2rem] border border-white/[0.05] backdrop-blur-xl flex flex-col justify-between h-32 transition-all hover:scale-105",
              item.bg
            )}>
              <div className="flex justify-between items-start">
                <item.icon size={16} className={cn("opacity-40", item.color)} />
                <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", item.color)}>{item.label}</span>
              </div>
              <h4 className={cn("text-3xl font-black tracking-tighter", item.color)}>{item.value}</h4>
            </div>
          ))}
        </motion.section>

        {/* Grid View */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="wait">
            {viewMode === 'tables' ? (
              tables.map(({ number, reservation, isSectionReserved }) => (
                <motion.div
                  key={`table-${number}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layoutId={`table-${number}`}
                  onClick={() => {
                    if (reservation) {
                      setDetailsModalReservation(reservation);
                    } else {
                      setSelectedTable(number);
                      setFormData(prev => ({ ...prev, session: activeSession, reservationType: 'table' }));
                      setIsModalOpen(true);
                    }
                  }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className={cn(
                    "group relative p-8 rounded-[2.5rem] border transition-all duration-500 cursor-pointer overflow-hidden h-full min-h-[300px]",
                    reservation 
                      ? "bg-white/[0.02] border-white/5 hover:border-red-500/40" 
                      : "bg-emerald-500/[0.02] border-dashed border-emerald-500/10 hover:border-emerald-500/40 hover:bg-emerald-500/[0.04]"
                  )}
                >
                  <div className="flex justify-between items-start mb-10">
                    <div className="space-y-1">
                      <span className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">Alpha Sector</span>
                      <h4 className="text-3xl font-black tracking-tighter">Table {number}</h4>
                    </div>
                    {reservation ? (
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border",
                        isSectionReserved ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isSectionReserved ? "bg-orange-500" : "bg-red-500")} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{isSectionReserved ? 'Reserved by Section' : 'Reserved'}</span>
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/40 group-hover:text-emerald-500 transition-colors">
                        Available
                      </div>
                    )}
                  </div>

                  {reservation ? (
                    <div className="space-y-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Host Guest</p>
                          <p className="text-sm font-bold truncate">{reservation.guestName}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="bg-white/[0.03] p-3 rounded-2xl border border-white/5">
                          <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mb-1">Guests</p>
                          <div className="flex items-center gap-2">
                            <Users size={14} className="text-white/40" />
                            <span className="text-xs font-bold">{reservation.guests} People</span>
                          </div>
                        </div>
                        <div className="bg-white/[0.03] p-3 rounded-2xl border border-white/5">
                          <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mb-1">Arrival</p>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-white/40" />
                            <span className="text-xs font-bold">{reservation.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 flex flex-col items-center justify-center gap-4 text-white/10 group-hover:text-emerald-500/40 transition-all">
                      <div className="w-14 h-14 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                        <Plus size={28} />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-[0.3em]">Add Reservation</span>
                    </div>
                  )}
                  
                  <div className={cn(
                    "absolute -bottom-10 -right-10 w-24 h-24 blur-[60px] opacity-20 transition-all duration-700",
                    reservation ? "bg-red-500" : "bg-emerald-500 group-hover:opacity-40"
                  )} />
                </motion.div>
              ))
            ) : (
              sections.map((section) => (
                <motion.div
                  key={`section-${section.id}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => {
                    if (section.reservation) {
                      setDetailsModalReservation(section.reservation);
                    } else {
                      setFormData(prev => ({ 
                        ...prev, 
                        session: activeSession, 
                        reservationType: 'section',
                        sectionId: section.id,
                        guests: section.totalTables * 4 // Default estimate
                      }));
                      setIsModalOpen(true);
                    }
                  }}
                  whileHover={{ y: -8 }}
                  className={cn(
                    "group relative p-8 rounded-[2.5rem] border transition-all duration-500 cursor-pointer overflow-hidden min-h-[300px]",
                    section.reservation 
                      ? "bg-red-500/[0.03] border-red-500/20 shadow-[0_20px_50px_rgba(239,68,68,0.1)]" 
                      : "bg-white/[0.02] border-white/5 hover:border-emerald-500/30"
                  )}
                >
                  <div className="flex justify-between items-start mb-10">
                    <div className="space-y-1">
                      <span className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">{section.description}</span>
                      <h4 className="text-3xl font-black tracking-tighter uppercase">{section.name}</h4>
                    </div>
                    {section.reservation ? (
                      <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-full border border-red-500/30">
                        <Plus size={14} className="rotate-45" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">FULL RESERVED</span>
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 rounded-xl">
                        {section.totalTables - section.reservedCount} FREE TABLES
                      </div>
                    )}
                  </div>

                  {section.reservation ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                          <Users size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mb-0.5">Section Host</p>
                          <p className="text-lg font-bold truncate tracking-tight">{section.reservation.guestName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {section.tables.map(t => (
                            <div key={t} className="w-8 h-8 rounded-full bg-[#121215] border-2 border-[#121215] flex items-center justify-center">
                              <span className="text-[8px] font-black text-white/40">{t}</span>
                            </div>
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Tables Locked</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-2xl p-4 flex flex-col justify-center">
                          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Capactiy</p>
                          <p className="text-lg font-bold">{section.totalTables * 4} Guests</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 flex flex-col justify-center">
                          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Layout</p>
                          <p className="text-lg font-bold">{section.totalTables} Tables</p>
                        </div>
                      </div>
                      <div className="h-px bg-white/5 w-full" />
                      <div className="flex items-center justify-center gap-3 text-emerald-500/40 group-hover:text-emerald-500 transition-all font-bold text-[10px] uppercase tracking-[0.3em]">
                        Reserve Entire Zone <ChevronRight size={14} />
                      </div>
                    </div>
                  )}

                  <div className={cn(
                    "absolute -bottom-20 -right-20 w-48 h-48 blur-[80px] opacity-10 transition-all duration-1000",
                    section.reservation ? "bg-red-500 opacity-30" : "bg-emerald-500 group-hover:opacity-20"
                  )} />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </section>

        {/* FAB */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setSelectedTable(null);
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
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, reservationType: 'table'})}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                        formData.reservationType === 'table' ? "bg-emerald-500 text-white" : "text-white/20"
                      )}
                    >
                      Single Table
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, reservationType: 'section'})}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                        formData.reservationType === 'section' ? "bg-red-500 text-white" : "text-white/20"
                      )}
                    >
                      Full Section
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2 block">Guest Name</label>
                      <Input 
                        placeholder="e.g. Mr. Sharma"
                        required
                        value={formData.guestName}
                        onChange={e => setFormData({...formData, guestName: e.target.value})}
                        className="h-14 bg-white/5 border-white/10 rounded-2xl"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2 block">Phone Number</label>
                      <Input 
                        placeholder="+91 00000 00000"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="h-14 bg-white/5 border-white/10 rounded-2xl"
                      />
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
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2 block">Arrival Time</label>
                      <Input 
                        type="time"
                        required
                        value={formData.time}
                        onChange={e => setFormData({...formData, time: e.target.value})}
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
                    {formData.reservationType === 'table' ? (
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2 block">Table #</label>
                        <Input 
                          type="number"
                          required
                          value={selectedTable || ''}
                          onChange={e => setSelectedTable(parseInt(e.target.value))}
                          className="h-14 bg-white/5 border-white/10 rounded-2xl"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2 block">Select Section</label>
                        <select 
                          required
                          value={formData.sectionId}
                          onChange={e => setFormData({...formData, sectionId: e.target.value})}
                          className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="" disabled className="bg-[#121215]">Choose Area</option>
                          {SECTIONS.map(s => <option key={s.id} value={s.id} className="bg-[#121215]">{s.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4">
                    <Button type="submit" className={cn(
                      "w-full h-16 rounded-2xl font-bold tracking-[0.2em] uppercase transition-all duration-500",
                      formData.reservationType === 'table' ? "bg-emerald-500 shadow-[0_15px_30px_rgba(16,185,129,0.3)]" : "bg-red-500 shadow-[0_15px_30px_rgba(239,68,68,0.3)]"
                    )}>
                      {formData.reservationType === 'table' ? 'Confirm Table Reservation' : 'Confirm Section Lockdown'}
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
                    <span className="text-red-500 text-[11px] font-bold uppercase tracking-[0.3em] block mb-2">
                      {detailsModalReservation.reservationType === 'section' ? 'Full Area Lockdown' : 'Confirmed Reservation'}
                    </span>
                    <h3 className="text-4xl font-black tracking-tighter">
                      {detailsModalReservation.reservationType === 'section' 
                        ? (SECTIONS.find(s => s.id === detailsModalReservation.sectionId)?.name || 'Custom Section')
                        : `Table ${detailsModalReservation.tableNumber}`}
                    </h3>
                  </div>
                  <button onClick={() => setDetailsModalReservation(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-8">
                  {detailsModalReservation.reservationType === 'section' && (
                    <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-3xl space-y-3">
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Locked Tables</p>
                      <div className="flex flex-wrap gap-2">
                        {detailsModalReservation.tables?.map((t: number) => (
                          <div key={t} className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-xs font-bold">T-{t}</div>
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

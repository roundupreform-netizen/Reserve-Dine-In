import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/core';
import { 
  ChevronLeft, 
  GripVertical, 
  Calendar as CalendarIcon,
  Clock,
  Users,
  Plus,
  LayoutGrid,
  List,
  Coffee,
  CheckCircle2,
  Trash2,
  Edit2,
  Eye,
  MoreVertical,
  Utensils
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  subDays,
  eachDayOfInterval,
  getWeek,
  isToday,
  parseISO,
  startOfDay,
  endOfDay,
  eachHourOfInterval,
  addWeeks,
  subWeeks
} from 'date-fns';
import { cn } from '../lib/utils';
import NewReservationModal from '../components/modals/NewReservationModal';

type ViewMode = 'month' | 'week' | 'day';

const CalendarView = ({ 
  selectedDate, 
  onDateSelect,
  onDateOpen 
}: { 
  selectedDate: Date; 
  onDateSelect: (date: Date) => void;
  onDateOpen: (date: Date) => void;
}) => {
  const { user, userData } = useAuth();
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatsPanelOpen, setIsStatsPanelOpen] = useState(true);

  useEffect(() => {
    if (!user || !userData) return;
    setLoading(true);

    const q = query(collection(db, 'reservations'));
    const unsub = onSnapshot(q, (snap) => {
      setReservations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reservations');
    });
    return unsub;
  }, [user, userData]);

  const getDayReservations = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return reservations.filter(r => r.date === dateStr);
  };

  const getStatusColor = (date: Date) => {
    const res = getDayReservations(date);
    const hasHighTea = res.some(r => r.session === 'High Tea' || r.reservationType === 'High Tea');
    
    if (hasHighTea) return 'bg-purple-500';
    if (res.length > 15) return 'bg-red-500';
    if (res.length > 5) return 'bg-amber-500';
    if (res.length > 0) return 'bg-emerald-500';
    return 'bg-white/10';
  };

  const next = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
  };

  const prev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this reservation?")) {
      await deleteDoc(doc(db, 'reservations', id));
    }
  };

  const renderHeader = () => (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Reservation Flow</h1>
        <div className="flex items-center gap-2 text-white/40 font-medium">
          <CalendarIcon size={14} className="text-amber-500" />
          <span>{format(currentDate, viewMode === 'day' ? 'EEEE, MMMM dd, yyyy' : 'MMMM yyyy')}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Toggle View Mode */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          {[
            { id: 'month', label: 'Month', icon: LayoutGrid },
            { id: 'week', label: 'Week', icon: List },
            { id: 'day', label: 'Day', icon: Clock }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as ViewMode)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === mode.id 
                  ? "bg-amber-500 text-black shadow-lg" 
                  : "text-white/40 hover:text-white"
              )}
            >
              <mode.icon size={12} />
              {mode.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white/5 border border-white/5 p-1 rounded-2xl">
          <button onClick={prev} className="p-2.5 rounded-xl hover:bg-white/5 transition-colors text-white/40 hover:text-white">
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => {
              const today = new Date();
              setCurrentDate(today);
              onDateSelect(today);
            }}
            className="px-4 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white"
          >
            Today
          </button>
          <button onClick={next} className="p-2.5 rounded-xl hover:bg-white/5 transition-colors text-white/40 hover:text-white">
            <GripVertical size={20} />
          </button>
        </div>

        <Button 
          onClick={() => setIsModalOpen(true)}
          className="h-12 px-6 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all transform hover:scale-105"
        >
          <Plus size={18} className="mr-2" strokeWidth={3} />
          New Booking
        </Button>
      </div>
    </header>
  );

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const rows = [];
    let day = startDate;

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7">
          {days.map(d => (
            <div key={d} className="text-center text-[10px] font-black text-white/10 uppercase tracking-[0.3em] pb-4">{d}</div>
          ))}
        </div>
        <div className="bg-[#121215] border border-white/5 rounded-[2.5rem] overflow-hidden grid grid-cols-7 shadow-2xl">
          {calendarDays.map((d, i) => {
            const res = getDayReservations(d);
            const isSel = isSameDay(d, selectedDate);
            const isCurMonth = isSameMonth(d, monthStart);
            const statusColor = getStatusColor(d);

            return (
              <motion.div
                key={d.toString()}
                whileHover={{ scale: 0.98 }}
                onClick={() => {
                  onDateSelect(d);
                  setIsStatsPanelOpen(true);
                }}
                onDoubleClick={() => {
                   onDateOpen(d);
                }}
                className={cn(
                  "relative h-32 md:h-44 border border-white/[0.03] p-4 transition-all cursor-pointer group overflow-hidden",
                  !isCurMonth && "opacity-10 pointer-events-none",
                  isSel ? "bg-amber-500/[0.03]" : "hover:bg-white/[0.01]"
                )}
              >
                {isSel && (
                  <motion.div 
                    layoutId="calendar-selection-glow"
                    className="absolute inset-0 bg-amber-500/[0.05] border-2 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)] z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
                <div className="relative z-20 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black",
                      isToday(d) ? "bg-amber-500 text-black" : "text-white/40 group-hover:text-white"
                    )}>
                      {format(d, 'd')}
                    </span>
                    
                    {res.length > 0 && (
                      <div className="flex flex-col items-end gap-1">
                        <div className={cn("w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]", statusColor.replace('bg-', 'text-'))} />
                        <span className="text-[9px] font-black text-white/20">{res.length} RES</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {res.slice(0, 3).map((r) => (
                      <div key={r.id} className="flex items-center gap-1.5 group/item">
                         <div className={cn(
                           "w-1 h-1 rounded-full shrink-0",
                           r.session === 'High Tea' ? "bg-purple-500" : "bg-white/20"
                         )} />
                         <span className="text-[8px] font-bold text-white/40 truncate group-hover/item:text-white/70 transition-colors">
                           {r.time} • {r.guestName.split(' ')[0]}
                         </span>
                      </div>
                    ))}
                    {res.length > 3 && (
                      <p className="text-[7px] font-black text-white/10 pl-2 uppercase">+ {res.length - 3} more</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const days = eachDayOfInterval({ 
      start: weekStart, 
      end: addDays(weekStart, 6) 
    });
    const hours = eachHourOfInterval({
      start: startOfDay(currentDate),
      end: endOfDay(currentDate)
    });

    return (
      <div className="bg-[#121215] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[700px]">
        {/* Week View Header */}
        <div className="grid grid-cols-8 border-b border-white/5">
          <div className="p-4 border-r border-white/5" />
          {days.map(d => (
            <div key={d.toString()} className={cn(
              "p-4 text-center border-r border-white/5",
              isToday(d) && "bg-amber-500/5"
            )}>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">{format(d, 'EEE')}</p>
              <p className={cn(
                "text-lg font-black",
                isToday(d) ? "text-amber-500" : "text-white"
              )}>{format(d, 'd')}</p>
            </div>
          ))}
        </div>

        {/* Scrollable Grid */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-8">
            <div className="flex flex-col">
              {hours.map(h => (
                <div key={h.toString()} className="h-20 p-2 text-right border-b border-white/[0.02] border-r border-white/5">
                  <span className="text-[9px] font-black text-white/20 uppercase">{format(h, 'HH:mm')}</span>
                </div>
              ))}
            </div>
            {days.map(d => {
              const dayRes = getDayReservations(d);
              return (
                <div key={d.toString()} className="relative border-r border-white/5 min-h-full">
                  {hours.map(h => (
                    <div key={h.toString()} className="h-20 border-b border-white/[0.02] relative" />
                  ))}
                  {dayRes.map(r => {
                    const h = parseInt(r.time.split(':')[0]);
                    const m = parseInt(r.time.split(':')[1]);
                    const top = (h * 60 + m) / (24 * 60) * 100;
                    return (
                      <div 
                        key={r.id}
                        className="absolute left-1 right-1 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg overflow-hidden group cursor-pointer hover:bg-amber-500/20 transition-all z-10"
                        style={{ top: `${top}%`, height: '40px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDateSelect(d);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          onDateOpen(d);
                        }}
                      >
                         <p className="text-[8px] font-black text-amber-500 truncate">{r.time} • {r.guestName}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = eachHourOfInterval({
      start: startOfDay(currentDate),
      end: endOfDay(currentDate)
    });
    const dayRes = getDayReservations(currentDate);

    return (
      <div className="bg-[#121215] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl flex h-[700px]">
        <div className="w-24 flex flex-col border-r border-white/5">
           {hours.map(h => (
              <div key={h.toString()} className="h-24 p-4 text-right border-b border-white/[0.02]">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{format(h, 'HH:mm')}</span>
              </div>
           ))}
        </div>
        <div className="flex-1 relative overflow-y-auto no-scrollbar">
           {hours.map(h => (
             <div key={h.toString()} className="h-24 border-b border-white/[0.02]" />
           ))}
           {dayRes.map(r => {
             const h = parseInt(r.time.split(':')[0]);
             const m = parseInt(r.time.split(':')[1]);
             const top = (h * 60 + m) / (24 * 60) * 100;
             return (
               <div 
                key={r.id}
                className="absolute left-6 right-6 p-6 bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 rounded-3xl group cursor-pointer hover:border-amber-500/40 transition-all flex justify-between items-center"
                style={{ top: `${top}%`, height: '80px' }}
               >
                 <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-black font-black uppercase text-xs">
                      {r.reservationType === 'section' ? 'SEC' : r.selectedTables?.[0] || '??'}
                    </div>
                    <div>
                       <h4 className="text-lg font-black text-white">{r.guestName}</h4>
                       <p className="text-xs text-white/40 font-bold uppercase tracking-widest">{r.session} • {r.guests} PAX</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 pr-4">
                    <Button 
                      onClick={() => handleDelete(r.id)}
                      className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </Button>
                    <Button className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                      <Edit2 size={16} />
                    </Button>
                 </div>
               </div>
             );
           })}
        </div>
      </div>
    );
  };

  const selectedDayRes = useMemo(() => getDayReservations(selectedDate), [selectedDate, reservations]);

  const stats = useMemo(() => {
    const vip = selectedDayRes.filter(r => r.status === 'VIP' || r.isVIP).length;
    const tablesUsed = new Set(selectedDayRes.flatMap(r => r.selectedTables || [])).size;
    const revenue = selectedDayRes.reduce((acc, r) => acc + (Number(r.totalAmount) || 0), 0);
    const earliestTime = selectedDayRes.length > 0 
      ? selectedDayRes.sort((a,b) => a.time.localeCompare(b.time))[0].time 
      : 'N/A';
    
    return {
      total: selectedDayRes.length,
      vip,
      tablesUsed,
      availableTables: Math.max(0, 24 - tablesUsed), // Assuming 24 tables total
      revenue,
      earliestTime
    };
  }, [selectedDayRes]);

  return (
    <div className="flex-1 p-6 lg:p-12 overflow-y-auto no-scrollbar bg-[#030303]">
      <div className="max-w-[1700px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 h-full">
        
        {/* Main Calendar Space */}
        <div className="xl:col-span-8 2xl:col-span-9 space-y-10">
          {renderHeader()}
          
          <div className="relative">
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'day' && renderDayView()}
          </div>

          {/* Quick Stats Footer */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
             {[
               { label: 'Moderate', color: 'bg-amber-500', count: reservations.length, icon: CalendarIcon },
               { label: 'High Tea', color: 'bg-purple-500', count: reservations.filter(r => r.session === 'High Tea').length, icon: Coffee },
               { label: 'VIP Priority', color: 'bg-cyan-400', count: reservations.filter(r => r.status === 'VIP' || r.isVIP).length, icon: Utensils },
               { label: 'Available', color: 'bg-emerald-500', count: 30, icon: CheckCircle2 }
             ].map((stat, i) => (
               <div key={i} className="flex items-center gap-4 bg-white/[0.02] px-6 py-5 rounded-3xl border border-white/5 hover:bg-white/[0.04] transition-colors group">
                 <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110", stat.color.replace('bg-', 'bg-').concat('/10'))}>
                   <stat.icon size={16} className={stat.color.replace('bg-', 'text-')} />
                 </div>
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/30 leading-none mb-1">{stat.label}</p>
                   <p className="text-xl font-black text-white">{stat.count}</p>
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* Day Preview Panel - Side Drawer */}
        <AnimatePresence mode="wait">
          {isStatsPanelOpen && (
            <motion.div 
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="xl:col-span-4 2xl:col-span-3 h-fit sticky top-12"
            >
              <div className="bg-[#0A0A0C] border border-white/5 rounded-[3.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col font-sans relative">
                {/* Visual Glass Accent */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500/20 via-amber-500 to-amber-500/20 opacity-30" />
                
                <div className="p-10 space-y-10">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h2 className="text-6xl font-black text-white tracking-tighter leading-[0.8]">{format(selectedDate, 'dd')}</h2>
                      <p className="text-lg font-black text-white uppercase tracking-tight">{format(selectedDate, 'EEEE')}</p>
                      <p className="text-[11px] font-black text-amber-500 uppercase tracking-[0.3em]">{format(selectedDate, 'MMMM yyyy')}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={() => setIsStatsPanelOpen(false)}
                      className="text-white/20 hover:text-white hover:bg-white/5 rounded-full w-10 h-10 p-0"
                    >
                      < ChevronLeft className="rotate-180" />
                    </Button>
                  </div>

                  {/* Summary Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem] space-y-2 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.02] rounded-bl-[2rem] flex items-center justify-center">
                         <span className="text-white/5 font-black text-2xl group-hover:text-amber-500/10 transition-colors">01</span>
                       </div>
                       <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Total Bookings</p>
                       <p className="text-3xl font-black text-white tracking-tighter">{stats.total}</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem] space-y-2 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.02] rounded-bl-[2rem] flex items-center justify-center">
                         <span className="text-white/5 font-black text-2xl group-hover:text-cyan-400/10 transition-colors">02</span>
                       </div>
                       <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">VIP Guests</p>
                       <p className="text-3xl font-black text-cyan-400 tracking-tighter">{stats.vip}</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem] space-y-2 relative overflow-hidden group">
                       <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Occupied Tables</p>
                       <p className="text-3xl font-black text-white tracking-tighter">{stats.tablesUsed}</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem] space-y-2 relative overflow-hidden group">
                       <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Revenue Est.</p>
                       <p className="text-2xl font-black text-emerald-500 tracking-tighter font-mono">₹{stats.revenue}</p>
                    </div>
                  </div>

                  {/* Detail Stats */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Timeline Preview</span>
                       <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">Next: {stats.earliestTime}</span>
                    </div>

                    <motion.div 
                      key={selectedDate.toString()}
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: { transition: { staggerChildren: 0.05 } }
                      }}
                      className="space-y-3 max-h-[320px] overflow-y-auto no-scrollbar pr-2"
                    >
                      {selectedDayRes.length === 0 ? (
                        <motion.div 
                          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                          className="py-20 flex flex-col items-center justify-center text-center space-y-6 bg-white/[0.02] border border-dashed border-white/10 rounded-[2.5rem]"
                        >
                           <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/5">
                             <Utensils size={32} />
                           </div>
                           <div className="space-y-1">
                             <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Quiet Day Ahead</p>
                             <p className="text-[10px] text-white/20 font-medium">No reservations scheduled yet.</p>
                           </div>
                           <Button 
                             onClick={() => setIsModalOpen(true)}
                             className="h-10 px-6 bg-white/5 hover:bg-white/10 text-white/60 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all border border-white/5"
                           >
                             Add First Booking
                           </Button>
                        </motion.div>
                      ) : (
                        selectedDayRes.map((res) => (
                          <motion.div 
                            key={res.id} 
                            variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}
                            className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.06] transition-all group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-black text-[10px] group-hover:bg-amber-500 group-hover:text-black transition-colors">
                                {res.time.split(':')[0]}
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs font-black text-white truncate max-w-[120px]">{res.guestName}</p>
                                <p className="text-[9px] font-bold text-white/30 uppercase">{res.time} • {res.guests} Pax</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                res.status === 'VIP' || res.isVIP ? "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" : "bg-white/10"
                              )} />
                            </div>
                          </motion.div>
                        ))
                      )}
                    </motion.div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex flex-col gap-3">
                    <Button 
                      onDoubleClick={() => onDateOpen(selectedDate)}
                      onClick={() => onDateOpen(selectedDate)} // Support mobile click-through as well if needed, but per request double click opens detailed
                      className="w-full h-16 bg-white/5 hover:bg-amber-500 border border-white/5 text-white hover:text-black font-black uppercase tracking-[0.2em] rounded-[2.2rem] transition-all flex items-center justify-center gap-3 relative group overflow-hidden"
                    >
                       <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                       <Eye size={18} />
                       Open Full Log
                    </Button>
                    <p className="text-center text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Double click date to open fast</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <NewReservationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialDate={format(selectedDate, 'yyyy-MM-dd')}
      />
    </div>
  );
};

export default CalendarView;

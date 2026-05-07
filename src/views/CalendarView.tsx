import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
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
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
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
import { Button } from '../components/ui/button';
import NewReservationModal from '../components/modals/NewReservationModal';

type ViewMode = 'month' | 'week' | 'day';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'reservations'));
    const unsub = onSnapshot(q, (snap) => {
      setReservations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

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
            onClick={() => setCurrentDate(new Date())}
            className="px-4 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white"
          >
            Today
          </button>
          <button onClick={next} className="p-2.5 rounded-xl hover:bg-white/5 transition-colors text-white/40 hover:text-white">
            <ChevronRight size={20} />
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
                  setSelectedDate(d);
                  // Double click or similar could trigger modal
                }}
                onDoubleClick={() => {
                   setSelectedDate(d);
                   setIsModalOpen(true);
                }}
                className={cn(
                  "relative h-32 md:h-44 border border-white/[0.03] p-4 transition-all cursor-pointer group overflow-hidden",
                  !isCurMonth && "opacity-10 pointer-events-none",
                  isSel ? "bg-white/[0.03]" : "hover:bg-white/[0.01]"
                )}
              >
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

                {isSel && (
                  <motion.div 
                    layoutId="month-highlight" 
                    className="absolute inset-0 border-2 border-amber-500/30 rounded-sm pointer-events-none" 
                  />
                )}
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
                        onClick={() => {
                          setSelectedDate(d);
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

  return (
    <div className="flex-1 p-6 lg:p-12 overflow-y-auto no-scrollbar">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-4 gap-12">
        
        {/* Main Calendar Space */}
        <div className="xl:col-span-3 space-y-10">
          {renderHeader()}
          
          <div className="relative">
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'day' && renderDayView()}
          </div>

          {/* Quick Stats Footer */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             {[
               { label: 'Moderate', color: 'bg-amber-500', count: reservations.length },
               { label: 'Fully Booked', color: 'bg-red-500', count: 0 },
               { label: 'High Tea', color: 'bg-purple-500', count: reservations.filter(r => r.session === 'High Tea').length },
               { label: 'Available', color: 'bg-emerald-500', count: 30 }
             ].map((stat, i) => (
               <div key={i} className="flex items-center gap-3 bg-white/5 px-6 py-4 rounded-2xl border border-white/5">
                 <div className={cn("w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]", stat.color.replace('bg-', 'text-'))} />
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{stat.label}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Day Details Panel */}
        <div className="space-y-8">
           <AnimatePresence mode="wait">
             <motion.div
               key={selectedDate.toString()}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="bg-[#121215] border border-white/5 rounded-[3rem] p-10 space-y-8 sticky top-10"
             >
               <div className="space-y-2">
                 <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{format(selectedDate, 'dd')}</h2>
                 <div>
                    <p className="text-lg font-black text-white tracking-tight">{format(selectedDate, 'EEEE')}</p>
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">{format(selectedDate, 'MMMM yyyy')}</p>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-2">
                     <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Total Bookings</p>
                     <p className="text-3xl font-black text-white">{selectedDayRes.length}</p>
                  </div>
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-2">
                     <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Tables Used</p>
                     <p className="text-3xl font-black text-amber-500">
                       {new Set(selectedDayRes.flatMap(r => r.selectedTables || [])).size}
                     </p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30">Reservations Timeline</h4>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                      selectedDayRes.length > 15 ? "bg-red-500/20 text-red-500" : "bg-emerald-500/20 text-emerald-500"
                    )}>
                      {selectedDayRes.length > 15 ? 'Critical' : 'Available'}
                    </span>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                    {selectedDayRes.length === 0 ? (
                      <div className="py-20 text-center space-y-4 opacity-10">
                        <Utensils size={40} className="mx-auto" strokeWidth={1} />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Bookings Yet</p>
                      </div>
                    ) : (
                      selectedDayRes.map((res) => (
                        <div key={res.id} className="group p-5 bg-white/[0.03] border border-white/5 rounded-3xl hover:bg-white/[0.06] transition-all hover:-translate-y-1">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-black font-black text-xs">
                                 {res.time.split(':')[0]}
                               </div>
                               <div>
                                 <h5 className="text-sm font-black text-white">{res.guestName}</h5>
                                 <p className="text-[10px] font-bold text-white/40 uppercase truncate max-w-[120px]">{res.session} • {res.guests} PAX</p>
                               </div>
                            </div>
                            <div className="relative group/menu">
                               <MoreVertical size={16} className="text-white/20" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-[9px] font-black text-amber-500/80 uppercase">
                                   <Clock size={10} />
                                   {res.time}
                                </div>
                                <div className="flex items-center gap-1 text-[9px] font-black text-white/40 uppercase">
                                   <LayoutGrid size={10} />
                                   {res.reservationType === 'section' ? `Section: ${res.sectionId}` : res.selectedTables?.join(', ') || 'UNASSIGNED'}
                                </div>
                             </div>
                             <div className="flex gap-2">
                                <Button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(res.id);
                                  }}
                                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/20 hover:text-red-500 transition-all p-0"
                                >
                                  <Trash2 size={12} />
                                </Button>
                                <Button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/20 hover:text-white transition-all p-0">
                                  <Eye size={12} />
                                </Button>
                             </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
               </div>

               <Button 
                onClick={() => setIsModalOpen(true)}
                className="w-full h-16 bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 font-black uppercase tracking-[0.2em] rounded-3xl transition-all flex items-center justify-center gap-3"
               >
                 <Plus size={20} className="text-amber-500" />
                 Book Selected Day
               </Button>
             </motion.div>
           </AnimatePresence>
        </div>
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

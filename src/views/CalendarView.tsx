import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Calendar as CalendarIcon,
  Clock,
  Users,
  Star,
  Plus
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
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
  eachDayOfInterval 
} from 'date-fns';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const renderHeader = () => (
    <header className="flex justify-between items-center mb-10">
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tighter text-white">Event Horizon</h1>
        <p className="text-white/40 font-medium">Monthly and daily booking distribution</p>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 bg-white/5 border border-white/5 p-1 rounded-2xl">
          <button onClick={prevMonth} className="p-2.5 rounded-xl hover:bg-white/5 transition-colors text-white/40 hover:text-white">
            <ChevronLeft size={20} />
          </button>
          <span className="px-6 text-sm font-black uppercase tracking-[0.2em] text-white">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button onClick={nextMonth} className="p-2.5 rounded-xl hover:bg-white/5 transition-colors text-white/40 hover:text-white">
            <ChevronRight size={20} />
          </button>
        </div>
        <button 
          onClick={() => setCurrentDate(new Date())}
          className="h-12 px-6 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/5 transition-all"
        >
          Today
        </button>
      </div>
    </header>
  );

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-4">
        {days.map((day, i) => (
          <div key={i} className="text-center text-[10px] font-black text-white/10 uppercase tracking-[0.3em]">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayRes = getDayReservations(cloneDay);
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <motion.div
            key={day.toString()}
            whileHover={{ scale: 0.98 }}
            onClick={() => setSelectedDate(cloneDay)}
            className={cn(
              "relative h-32 md:h-40 border border-white/[0.03] p-3 transition-all cursor-pointer group overflow-hidden",
              !isCurrentMonth && "opacity-20 pointer-events-none",
              isSelected ? "bg-amber-500/5 border-amber-500/20" : "hover:bg-white/[0.02]"
            )}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={cn(
                "text-xs font-black",
                isSameDay(day, new Date()) ? "text-amber-500" : "text-white/40 group-hover:text-white/60"
              )}>
                {format(day, 'd')}
              </span>
              {dayRes.length > 0 && (
                <div className="flex -space-x-1">
                  {dayRes.slice(0, 3).map((r, idx) => (
                    <div key={idx} className={cn(
                      "w-2 h-2 rounded-full",
                      r.status === 'VIP' ? "bg-purple-500" :
                      r.status === 'confirmed' ? "bg-green-500" :
                      r.status === 'pending' ? "bg-orange-500" : "bg-red-500"
                    )} />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5 overflow-hidden">
              {dayRes.slice(0, 3).map((r: any) => (
                <div key={r.id} className={cn(
                  "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter truncate border",
                  r.status === 'VIP' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                  r.status === 'confirmed' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                  "bg-white/5 text-white/40 border-white/5"
                )}>
                  {r.guestName?.split(' ')[0]} • T{r.tableId || '?'}
                </div>
              ))}
              {dayRes.length > 3 && (
                <p className="text-[7px] font-black text-white/20 pl-1 uppercase">
                  + {dayRes.length - 3} more
                </p>
              )}
            </div>
            {isSelected && (
              <motion.div layoutId="cell-highlight" className="absolute inset-0 border-2 border-amber-500/40 rounded-sm pointer-events-none" />
            )}
          </motion.div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="bg-[#121215] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        {rows}
      </div>
    );
  };

  const selectedDayRes = getDayReservations(selectedDate);

  return (
    <div className="flex-1 p-6 lg:p-12 overflow-y-auto">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-4 gap-12">
        <div className="xl:col-span-3 space-y-10">
          {renderHeader()}
          <div className="space-y-4">
            {renderDays()}
            {renderCells()}
          </div>
        </div>

        {/* Sidebar: Selected Date Details */}
        <div className="space-y-8">
          <div className="bg-[#121215] border border-white/5 p-8 rounded-[2.5rem] space-y-8">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{format(selectedDate, 'EEEE')}</h3>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">{format(selectedDate, 'MMMM dd, yyyy')}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Bookings</p>
                <p className="text-xl font-black text-white leading-none">{selectedDayRes.length}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">VIPs</p>
                <p className="text-xl font-black text-purple-500 leading-none">{selectedDayRes.filter(r => r.status === 'VIP').length}</p>
              </div>
            </div>

            <div className="h-px bg-white/5" />

            <div className="space-y-4">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Schedule for today</p>
              <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
                {selectedDayRes.length === 0 ? (
                  <div className="py-12 text-center space-y-3 opacity-20">
                    <CalendarIcon size={32} className="mx-auto" strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Clear Schedule</p>
                  </div>
                ) : (
                  selectedDayRes.map((res) => (
                    <div key={res.id} className="group p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-amber-500/20 transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-white/40">
                            {res.time[0]}{res.time[1]}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white leading-none mb-1">{res.guestName}</h4>
                            <p className="text-[8px] text-white/20 font-black uppercase tracking-widest">{res.phone}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          res.status === 'VIP' ? "bg-purple-500" : "bg-emerald-500"
                        )} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Users size={10} className="text-amber-500" />
                            <span className="text-[9px] text-white/80">{res.guests}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold">
                            <Clock size={10} className="text-amber-500" />
                            <span className="text-[9px] text-white/80">{res.time}</span>
                          </div>
                        </div>
                        <Button className="h-7 px-3 bg-white/5 hover:bg-white/10 text-[8px] font-black uppercase tracking-widest text-white rounded-lg">Details</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <Button className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest rounded-[1.5rem] shadow-xl group">
            <Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform" />
            Book This Day
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  MoreVertical,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const ReservationsView = ({ onNewReservation }: { onNewReservation?: () => void }) => {
  const { user, userData } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'pending': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'occupied': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'VIP': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'seated': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'completed': return 'text-white/40 bg-white/5 border-white/10';
      case 'cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-white/40 bg-white/5';
    }
  };

  const filtered = reservations
    .filter(r => filter === 'all' || r.status === filter)
    .filter(r => r.guestName?.toLowerCase().includes(search.toLowerCase()) || r.phone?.includes(search))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex-1 p-6 lg:p-12 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white">Guest Log</h1>
            <p className="text-white/40 font-medium">Manage master reservations, walk-ins and events</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-80">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
              <input 
                type="text" 
                placeholder="Find customer..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 bg-white/[0.03] border border-white/5 rounded-xl pl-11 pr-4 text-sm focus:border-amber-500/30 outline-none text-white transition-all"
              />
            </div>
            <Button 
              onClick={() => onNewReservation?.()}
              className="h-12 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest px-8 rounded-xl shadow-lg"
            >
              <Plus size={18} className="mr-2" />
              New Booking
            </Button>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {['all', 'pending', 'confirmed', 'seated', 'completed', 'cancelled', 'VIP'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-6 h-10 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                filter === s ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-white/5 text-white/20 hover:text-white/40"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Table View */}
        <div className="bg-[#121215] border border-white/5 rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-widest">Guest Details</th>
                  <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-widest">Schedule</th>
                  <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-widest">Seating</th>
                  <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((res) => (
                  <tr key={res.id} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-transform group-hover:scale-110",
                          res.status === 'VIP' ? "bg-purple-500/10 text-purple-500" : "bg-white/5 text-white/40"
                        )}>
                          {res.guestName?.[0]}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white mb-0.5">{res.guestName}</h4>
                          <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{res.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-white/80 text-xs font-bold">
                          <CalendarIcon size={12} className="text-amber-500" />
                          {res.date}
                        </div>
                        <div className="flex items-center gap-2 text-white/30 text-[10px] font-bold uppercase">
                          <Clock size={12} />
                          {res.time} • {res.session}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-white/80 text-xs font-bold">
                          <Users size={12} className="text-amber-500" />
                          {res.guests} PAX
                        </div>
                        <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">
                          {res.reservationType === 'section' ? `Section: ${res.sectionId}` : res.selectedTables?.length > 0 ? `Tables: ${res.selectedTables.join(', ')}` : 'No Tables'}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "inline-flex items-center px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                        getStatusColor(res.status)
                      )}>
                        {res.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                          <MessageSquare size={16} />
                        </button>
                        <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filtered.length === 0 && (
            <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center text-white/10">
                <AlertCircle size={40} strokeWidth={1} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">No guests found</h3>
                <p className="text-sm text-white/40">Adjust your filters or start a new reservation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservationsView;

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
  AlertCircle,
  X,
  Phone,
  Crown,
  CheckCircle2,
  MapPin,
  Timer,
  Utensils
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { format, isToday } from 'date-fns';

import { Toast, ToastType } from '../components/ui/Toast';
import NewReservationModal from '../components/modals/NewReservationModal';
import ReservationVoucher from '../components/reservations/ReservationVoucher';

interface Reservation {
  id: string;
  guestName: string;
  phone: string;
  email?: string;
  guests: number;
  date: string;
  time: string;
  session: string;
  status: 'Pending' | 'Confirmed' | 'Arrived' | 'Seated' | 'Dining' | 'Completed' | 'Cancelled' | 'Postponed' | 'No Show' | 'VIP';
  reservationType: 'table' | 'section' | 'multi';
  sectionId?: string;
  selectedTables?: any[];
  notes?: string;
  internalNotes?: string;
  diningPreferences?: string[];
  foodPreferences?: string[];
  tags?: string[];
  staffAssigned?: string;
  isVIP?: boolean;
  visitCount?: number;
  totalSpent?: number;
  history?: { action: string; timestamp: any; note?: string }[];
  timestamps?: {
    arrivedAt?: any;
    seatedAt?: any;
    diningAt?: any;
    completedAt?: any;
    cancelledAt?: any;
    postponedAt?: any;
  };
  createdAt?: any;
  userId?: string;
}

const ReservationsView = ({ onNewReservation, selectedDate, setSelectedDate }: { 
  onNewReservation?: () => void; 
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}) => {
  const { user, userData } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isPostponeOpen, setIsPostponeOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [newNote, setNewNote] = useState('');
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });

  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  });

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type, visible: true });
  };

  useEffect(() => {
    if (!user || !userData) return;
    setLoading(true);

    const q = query(collection(db, 'reservations'));
    const unsub = onSnapshot(q, (snap) => {
      setReservations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Reservation)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reservations');
    });
    return unsub;
  }, [user, userData]);

  const updateReservationStatus = async (resId: string, updates: Partial<Reservation>) => {
    try {
      await updateDoc(doc(db, 'reservations', resId), updates);
      setActiveMenuId(null);
      if (updates.status) {
        showToast(`Reservation marked as ${updates.status}`);
      } else if (updates.isVIP !== undefined) {
        showToast(updates.isVIP ? 'Guest marked as VIP' : 'VIP status removed');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reservations/${resId}`);
      showToast('Action failed. Data out of sync.', 'error');
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
      case 'Pending': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Arrived': return 'text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]';
      case 'Seated': return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
      case 'Dining': return 'text-pink-500 bg-pink-500/10 border-pink-500/20 animate-pulse';
      case 'VIP': return 'text-purple-500 bg-purple-500/20 border-purple-500/30 font-black shadow-[0_0_20px_rgba(168,85,247,0.2)]';
      case 'Completed': return 'text-white/20 bg-white/5 border-white/5';
      case 'Cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'No Show': return 'text-slate-500 bg-slate-500/10 border-slate-500/20 border-dashed';
      case 'Postponed': return 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20';
      default: return 'text-white/40 bg-white/5 border-white/5';
    }
  };

  const filtered = reservations
    .filter(r => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const matchesDate = r.date === dateStr;
      
      const matchesFilter = filter === 'all' ? true : 
                          filter === 'VIP' ? r.status === 'VIP' || r.isVIP :
                          r.status === filter;
      const matchesSearch = r.guestName?.toLowerCase().includes(search.toLowerCase()) || 
                           r.phone?.includes(search) ||
                           r.email?.toLowerCase().includes(search.toLowerCase());
      return matchesDate && matchesFilter && matchesSearch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAction = (action: string, res: Reservation) => {
    setSelectedRes(res);
    switch (action) {
      case 'details': setIsDetailOpen(true); break;
      case 'edit': setIsEditOpen(true); break;
      case 'notes': setIsNotesOpen(true); break;
      case 'arrived': 
        updateReservationStatus(res.id, { 
          status: 'Arrived', 
          timestamps: { ...res.timestamps, arrivedAt: new Date().toISOString() },
          history: [...(res.history || []), { action: 'Arrived', timestamp: new Date().toISOString() }]
        }); 
        break;
      case 'seated': 
        updateReservationStatus(res.id, { 
          status: 'Seated', 
          timestamps: { ...res.timestamps, seatedAt: new Date().toISOString() },
          history: [...(res.history || []), { action: 'Seated', timestamp: new Date().toISOString() }]
        }); 
        break;
      case 'dining': 
        updateReservationStatus(res.id, { 
          status: 'Dining', 
          timestamps: { ...res.timestamps, diningAt: new Date().toISOString() },
          history: [...(res.history || []), { action: 'Dining', timestamp: new Date().toISOString() }]
        }); 
        break;
      case 'completed': 
        updateReservationStatus(res.id, { 
          status: 'Completed', 
          timestamps: { ...res.timestamps, completedAt: new Date().toISOString() },
          history: [...(res.history || []), { action: 'Completed', timestamp: new Date().toISOString() }]
        }); 
        break;
      case 'vip': 
        updateReservationStatus(res.id, { 
          isVIP: !res.isVIP,
          history: [...(res.history || []), { action: !res.isVIP ? 'VIP Status Added' : 'VIP Status Removed', timestamp: new Date().toISOString() }]
        }); 
        break;
      case 'noshow': updateReservationStatus(res.id, { status: 'No Show' }); break;
      case 'cancel': setIsCancelOpen(true); break;
      case 'postpone': 
        setRescheduleData({ date: res.date, time: res.time });
        setIsPostponeOpen(true); 
        break;
      case 'delete': 
        if (confirm('Delete this reservation permanentely?')) {
          deleteDoc(doc(db, 'reservations', res.id));
        }
        break;
      case 'whatsapp':
      case 'print':
        setIsVoucherOpen(true);
        break;
    }
    setActiveMenuId(null);
  };

  const handleAddNote = async () => {
    if (!selectedRes || !newNote.trim()) return;
    const historyEntry = { action: 'Note Added', timestamp: new Date().toISOString(), note: newNote };
    const updatedNotes = selectedRes.internalNotes 
      ? `${selectedRes.internalNotes}\n\n[${new Date().toLocaleString()}] ${newNote}`
      : `[${new Date().toLocaleString()}] ${newNote}`;
    
    await updateReservationStatus(selectedRes.id, { 
      internalNotes: updatedNotes,
      history: [...(selectedRes.history || []), historyEntry]
    });
    setNewNote('');
    setIsNotesOpen(false);
  };

  const handleReschedule = async () => {
    if (!selectedRes) return;
    await updateReservationStatus(selectedRes.id, { 
      date: rescheduleData.date,
      time: rescheduleData.time,
      status: 'Postponed',
      history: [...(selectedRes.history || []), { 
        action: 'Postponed', 
        timestamp: new Date().toISOString(), 
        note: `Rescheduled to ${rescheduleData.date} at ${rescheduleData.time}` 
      }]
    });
    setIsPostponeOpen(false);
  };

  const handleCancel = async () => {
    if (!selectedRes) return;
    const finalReason = customCancelReason.trim() 
      ? `${cancelReason}${cancelReason ? ': ' : ''}${customCancelReason}`
      : cancelReason || 'No reason provided';
      
    await updateReservationStatus(selectedRes.id, { 
      status: 'Cancelled',
      history: [...(selectedRes.history || []), { 
        action: 'Cancelled', 
        timestamp: new Date().toISOString(), 
        note: finalReason
      }]
    });
    setIsCancelOpen(false);
    setCancelReason('');
    setCustomCancelReason('');
  };

  return (
    <div className="flex-1 p-6 lg:p-12 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white">Guest Log</h1>
            <div className="flex flex-col gap-1">
              <p className="text-white/40 font-medium">Manage master reservations, walk-ins and events</p>
              <motion.div 
                key={format(selectedDate, 'yyyy-MM-dd')}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 mt-2"
              >
                <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
                  <CalendarIcon size={12} className="text-amber-500" />
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                    Reservations for: {format(selectedDate, 'dd MMMM yyyy')}
                  </span>
                </div>
                {!isToday(selectedDate) && (
                  <button 
                    onClick={() => setSelectedDate(new Date())}
                    className="text-[10px] font-black text-white/20 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1 group"
                  >
                    View Today
                    <CheckCircle2 size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </motion.div>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-80">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
              <input 
                type="text" 
                id="res-search-input"
                data-8848-id="res-search-input"
                placeholder="Find customer..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 bg-white/[0.03] border border-white/5 rounded-xl pl-11 pr-4 text-sm focus:border-amber-500/30 outline-none text-white transition-all"
              />
            </div>
            <Button 
              id="new-reservation-btn"
              data-8848-id="new-reservation-btn"
              data-tactical="true"
              onClick={() => onNewReservation?.()}
              className="h-12 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest px-8 rounded-xl shadow-lg"
            >
              <Plus size={18} className="mr-2" />
              New Booking
            </Button>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 w-full lg:w-auto">
            {['all', 'Pending', 'Confirmed', 'Arrived', 'Seated', 'Dining', 'Completed', 'Cancelled', 'No Show', 'VIP'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "px-5 h-10 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  filter === s 
                    ? "bg-white/10 border-white/20 text-white shadow-[0_5px_15px_rgba(255,255,255,0.05)]" 
                    : "bg-transparent border-white/5 text-white/20 hover:text-white/40"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 p-1.5 rounded-2xl border border-white/5 w-full lg:w-auto">
            <div className="flex items-center gap-2 px-3 border-r border-white/10 pr-6">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">LIVE SYNC ACTIVE</span>
            </div>
            <div className="flex items-center gap-2 px-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{filtered.length} Results</span>
            </div>
          </div>
        </div>

        {/* CRM Table View */}
        <div className="bg-[#0F0F12] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01]">
                  <th className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] w-[350px]">Guest Profiling</th>
                  <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Service Window</th>
                  <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Allocation</th>
                  <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">CRM Status</th>
                  <th className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((res) => (
                  <tr key={res.id} className="group hover:bg-white/[0.02] transition-all relative">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-5">
                        <div className="relative">
                          <div className={cn(
                            "w-14 h-14 rounded-[1.5rem] flex items-center justify-center font-black transition-all duration-500 group-hover:rotate-6",
                            res.isVIP || res.status === 'VIP' 
                              ? "bg-purple-500/20 text-purple-500 ring-2 ring-purple-500/20" 
                              : "bg-white/5 text-white/20"
                          )}>
                            {res.guestName?.[0]}
                          </div>
                          {(res.isVIP || res.status === 'VIP') && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg transform -rotate-12">
                              <Crown size={12} className="text-black" fill="currentColor" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                            {res.guestName}
                            {res.visitCount && res.visitCount > 5 && (
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] rounded uppercase font-black">Loyal</span>
                            )}
                          </h4>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-white/20 font-bold tracking-widest">{res.phone}</span>
                            <span className="w-1 h-1 rounded-full bg-white/10" />
                            <span className="text-[10px] text-white/20 font-medium lowercase italic">{res.email || 'no-email@guest.log'}</span>
                          </div>
                          {res.tags && res.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {res.tags.map((t, i) => (
                                <span key={i} className="text-[8px] bg-white/5 text-white/40 px-2 py-0.5 rounded-full uppercase font-black">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-white/90 text-[13px] font-black tracking-tight">
                          <CalendarIcon size={14} className="text-emerald-500" />
                          {res.date}
                        </div>
                        <div className="flex items-center gap-3 text-white/30 text-[11px] font-bold uppercase tracking-wider">
                          <Clock size={14} />
                          {res.time} <span className="text-white/10">•</span> {res.session}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-white/90 text-[13px] font-black tracking-tight">
                          <Users size={14} className="text-emerald-500" />
                          {res.guests} PAX
                        </div>
                        <div className="flex items-center gap-2">
                           <MapPin size={12} className="text-white/20" />
                           <p className="text-[11px] text-white/30 font-black uppercase tracking-widest">
                            {res.reservationType === 'section' ? `Sec: ${res.sectionId}` : res.selectedTables?.length > 0 ? `T: ${res.selectedTables.join(', ')}` : 'Waitlist'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <motion.div 
                        layoutId={`status-${res.id}`}
                        className={cn(
                          "inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-500",
                          getStatusStyle(res.status)
                        )}
                      >
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full mr-3",
                          res.status === 'Confirmed' ? "bg-emerald-500 shadow-[0_0_8px_#10B981]" : "bg-current"
                        )} />
                        {res.status}
                      </motion.div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end gap-3">
                         <div className="flex gap-2">
                            <button 
                              onClick={() => handleAction('whatsapp', res)}
                              className="w-11 h-11 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/20 text-emerald-500/60 hover:text-emerald-500 transition-all flex items-center justify-center border border-emerald-500/10"
                            >
                              <Phone size={18} />
                            </button>
                            <button 
                              onClick={() => { setSelectedRes(res); setIsDetailOpen(true); }}
                              className="w-11 h-11 rounded-xl bg-blue-500/5 hover:bg-blue-500/20 text-blue-500/60 hover:text-blue-500 transition-all flex items-center justify-center border border-blue-500/10"
                            >
                              <Search size={18} />
                            </button>
                         </div>

                         <div className="relative">
                            <button 
                              onClick={() => setActiveMenuId(activeMenuId === res.id ? null : res.id)}
                              className={cn(
                                "w-11 h-11 rounded-xl transition-all flex items-center justify-center border",
                                activeMenuId === res.id ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/5 text-white/40 hover:text-white"
                              )}
                            >
                              <MoreVertical size={18} />
                            </button>

                            <AnimatePresence>
                              {activeMenuId === res.id && (
                                <>
                                  <div className="fixed inset-0 z-[60]" onClick={() => setActiveMenuId(null)} />
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 top-full mt-3 w-64 bg-[#1A1A1E] border border-white/10 rounded-3xl shadow-2xl z-[70] p-3 overflow-hidden"
                                  >
                                    <div className="space-y-1">
                                      {[
                                        { id: 'details', label: 'View Details', icon: Search },
                                        { id: 'edit', label: 'Edit Reservation', icon: Plus }, // Reusing Plus as edit
                                        { id: 'notes', label: 'Add Notes', icon: MessageSquare },
                                        { divider: true },
                                        { id: 'arrived', label: 'Mark as Arrived', icon: Clock, color: 'text-blue-500' },
                                        { id: 'seated', label: 'Mark as Seated', icon: Users, color: 'text-indigo-500' },
                                        { id: 'dining', label: 'Mark as Dining', icon: Utensils, color: 'text-pink-500' },
                                        { id: 'completed', label: 'Mark as Completed', icon: CheckCircle2, color: 'text-white/40' },
                                        { id: 'vip', label: 'Toggle VIP Status', icon: Crown, color: 'text-purple-500' },
                                        { divider: true },
                                        { id: 'postpone', label: 'Postpone', icon: Timer, color: 'text-cyan-500' },
                                        { id: 'noshow', label: 'Mark as No Show', icon: X, color: 'text-slate-500' },
                                        { id: 'cancel', label: 'Cancel Booking', icon: X, color: 'text-red-500' },
                                        { divider: true },
                                        { id: 'whatsapp', label: 'Send WhatsApp', icon: Phone, color: 'text-emerald-500' },
                                        { id: 'print', label: 'Print Voucher', icon: Search },
                                        { id: 'delete', label: 'Delete Entry', icon: X, color: 'text-red-500' },
                                      ].map((item, idx) => item.divider ? (
                                        <div key={idx} className="h-px bg-white/5 my-2" />
                                      ) : (
                                        <button 
                                          key={idx}
                                          onClick={() => handleAction(item.id!, res)}
                                          className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all text-left",
                                            item.color || "text-white/60 hover:text-white hover:bg-white/5"
                                          )}
                                        >
                                          {item.icon && <item.icon size={14} />}
                                          {item.label}
                                        </button>
                                      ))}
                                    </div>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                         </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sliding Detail Panel */}
        <AnimatePresence>
          {isDetailOpen && selectedRes && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsDetailOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-screen w-full lg:w-[650px] bg-[#0A0A0C] border-l border-white/5 shadow-2xl z-[110] flex flex-col"
              >
                <div className="flex-1 overflow-y-auto no-scrollbar p-10 space-y-12">
                  <header className="flex justify-between items-center">
                    <button 
                      onClick={() => setIsDetailOpen(false)}
                      className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <X size={24} />
                    </button>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => { setIsDetailOpen(false); setIsEditOpen(true); }}
                         className="px-6 h-12 rounded-2xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px]"
                       >
                         Edit Profile
                       </button>
                       <button 
                         onClick={() => setIsNotesOpen(true)}
                         className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"
                       >
                         <MessageSquare size={20} />
                       </button>
                    </div>
                  </header>

                  <div className="flex items-center gap-8">
                     <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-5xl font-black text-white shadow-2xl">
                        {selectedRes.guestName[0]}
                     </div>
                     <div className="space-y-2">
                        <div className="flex items-center gap-3">
                           <h2 className="text-4xl font-black tracking-tighter text-white">{selectedRes.guestName}</h2>
                           {selectedRes.isVIP && <Crown className="text-amber-500" fill="currentColor" />}
                        </div>
                        <div className="flex flex-wrap gap-2">
                           <span className={cn("px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border", getStatusStyle(selectedRes.status))}>
                              {selectedRes.status}
                           </span>
                           <span className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] bg-white/5 border border-white/10 text-white/40">
                              Guest ID: {selectedRes.id.slice(-6).toUpperCase()}
                           </span>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
                     <div className="space-y-6">
                        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Service Insight</h5>
                        <div className="space-y-4">
                           <DetailItem icon={CalendarIcon} label="Scheduled Date" value={selectedRes.date} />
                           <DetailItem icon={Clock} label="Estimated Arrival" value={`${selectedRes.time} (${selectedRes.session})`} />
                           <DetailItem icon={Users} label="Pax Dimensions" value={`${selectedRes.guests} Guests`} />
                           <DetailItem icon={MapPin} label="Zone Allocation" value={selectedRes.reservationType === 'section' ? `Section ${selectedRes.sectionId}` : `Tables ${selectedRes.selectedTables?.join(', ') || 'Waitlist'}`} />
                        </div>
                     </div>
                     <div className="space-y-6">
                        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Contact Trace</h5>
                        <div className="space-y-4">
                           <DetailItem icon={Phone} label="Primary Comms" value={selectedRes.phone} />
                           <DetailItem icon={MessageSquare} label="Email Protocol" value={selectedRes.email || 'Not Provisioned'} />
                        </div>
                     </div>
                  </div>

                  {selectedRes.history && selectedRes.history.length > 0 && (
                    <div className="space-y-6 pt-8 border-t border-white/5">
                      <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">Activity Ledger</h5>
                      <div className="space-y-4">
                        {selectedRes.history.slice().reverse().map((h, i) => (
                          <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                            <div className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                            <div className="space-y-1">
                              <p className="text-[11px] font-black text-white/90">{h.action}</p>
                              <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{new Date(h.timestamp).toLocaleString()}</p>
                              {h.note && <p className="text-xs text-white/40 mt-2 italic">"{h.note}"</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-6 pt-8 border-t border-white/5">
                     <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500">Catering & Dining Vectors</h5>
                     <div className="grid grid-cols-1 gap-4">
                        <PreferenceBox 
                          title="Dining Preferences" 
                          items={selectedRes.diningPreferences?.length ? selectedRes.diningPreferences : ['Standard Seating']} 
                          color="bg-purple-500/10 text-purple-400"
                        />
                        <PreferenceBox 
                          title="Dietary Archetypes" 
                          items={selectedRes.foodPreferences?.length ? selectedRes.foodPreferences : ['No Preferences']} 
                          color="bg-amber-500/10 text-amber-400"
                        />
                     </div>
                  </div>

                  <div className="space-y-6 pt-8 border-t border-white/5">
                     <div className="flex justify-between items-center">
                        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500">Intelligence & Logs</h5>
                        <button onClick={() => setIsNotesOpen(true)} className="text-[10px] font-black uppercase text-white/20 hover:text-white transition-colors">Append Entry</button>
                     </div>
                     <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] space-y-4">
                        <div className="space-y-2">
                           <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Guest Narrative (Booking)</p>
                           <p className="text-sm text-white/80 leading-relaxed italic">"{selectedRes.notes || 'No specific narrative provided by guest.'}"</p>
                        </div>
                        <div className="h-px bg-white/5" />
                        <div className="space-y-2">
                           <p className="text-[10px] font-black uppercase tracking-widest text-pink-500/40">Staff Strategy History</p>
                           <div className="text-sm text-pink-200/60 leading-relaxed font-medium whitespace-pre-wrap">
                              {selectedRes.internalNotes || 'No internal strategy notes yet.'}
                           </div>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="p-8 border-t border-white/5 bg-white/[0.02] grid grid-cols-2 gap-4">
                   <button 
                    onClick={() => handleAction('cancel', selectedRes)}
                    className="h-14 rounded-2xl bg-white/5 border border-white/10 font-black uppercase tracking-widest text-[10px] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all"
                  >
                    Cancel Booking
                   </button>
                   <button 
                    onClick={() => handleAction(selectedRes.status === 'Arrived' ? 'seated' : selectedRes.status === 'Seated' ? 'dining' : 'arrived', selectedRes)}
                    className="h-14 rounded-2xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  >
                    {selectedRes.status === 'Arrived' ? 'Initiate Seating' : selectedRes.status === 'Seated' ? 'Mark Dining' : 'Mark Arrived'}
                   </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* --- Functional Modals --- */}

        {/* Notes Modal */}
        <Modal 
          isOpen={isNotesOpen} 
          onClose={() => setIsNotesOpen(false)} 
          title="Staff Intelligence Note"
          subtitle="Add internal notes about guest preferences or special handling"
        >
          <div className="space-y-6">
            <textarea 
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Enter internal staff notes here..."
              className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white focus:border-amber-500/50 outline-none transition-all placeholder:text-white/20"
            />
            <button 
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              className="w-full h-14 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all"
            >
              Append to Ledger
            </button>
          </div>
        </Modal>

        {/* Postpone Modal */}
        <Modal 
          isOpen={isPostponeOpen} 
          onClose={() => setIsPostponeOpen(false)} 
          title="Reschedule Logic"
          subtitle="Adjust the scheduled service window for this guest"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">New Date</label>
                <input 
                  type="date"
                  value={rescheduleData.date}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm text-white focus:border-amber-500/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">New Time</label>
                <input 
                  type="time"
                  value={rescheduleData.time}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm text-white focus:border-amber-500/20 outline-none"
                />
              </div>
            </div>
            <button 
              onClick={handleReschedule}
              className="w-full h-14 bg-cyan-500 hover:bg-cyan-600 text-black font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all"
            >
              Confirm Reschedule
            </button>
          </div>
        </Modal>

        {/* Cancel Modal */}
        <Modal 
          isOpen={isCancelOpen} 
          onClose={() => setIsCancelOpen(false)} 
          title="Cancellation Protocol"
          subtitle="State the reason for termination of this service window"
        >
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/50 ml-2">Reason Category</label>
                <select 
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm text-white focus:border-red-500/20 outline-none transition-all appearance-none cursor-pointer hover:bg-white/[0.07]"
                >
                  <option value="" className="bg-[#121215]">Select a category...</option>
                  <option value="Guest requested" className="bg-[#121215]">Guest requested</option>
                  <option value="No show" className="bg-[#121215]">No show after grace period</option>
                  <option value="Capacity" className="bg-[#121215]">Outlet capacity reached</option>
                  <option value="Other" className="bg-[#121215]">Other reason...</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/50">Manual Reason / Detailed Note</label>
                  <span className="text-[9px] font-bold text-white/20 uppercase tabular-nums">{customCancelReason.length} / 500</span>
                </div>
                <textarea 
                  value={customCancelReason}
                  onChange={(e) => setCustomCancelReason(e.target.value.slice(0, 500))}
                  placeholder="Type a manual reason here if category is 'Other' or to add details..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white focus:border-red-500/30 outline-none transition-all placeholder:text-white/20 resize-none"
                />
              </div>
            </div>
            <button 
              onClick={handleCancel}
              className="w-full h-14 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.2)] transition-all active:scale-[0.98]"
            >
              Finalize Cancellation
            </button>
          </div>
        </Modal>

        {/* Edit Modal (Reusing NewReservationModal) */}
        <NewReservationModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          initialData={selectedRes}
        />

        <ReservationVoucher
          isOpen={isVoucherOpen}
          onClose={() => setIsVoucherOpen(false)}
          reservation={selectedRes}
        />
          
        <Toast 
          message={toast.message} 
          type={toast.type} 
          isVisible={toast.visible} 
          onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
        />

        {filtered.length === 0 && (
          <AnimatePresence mode="wait">
            <motion.div 
              key={format(selectedDate, 'yyyy-MM-dd')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-20 flex flex-col items-center justify-center text-center space-y-8 bg-[#0F0F12] border border-white/5 rounded-[3rem]"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 flex items-center justify-center text-white/5 group-hover:text-amber-500/20 transition-all">
                  <CalendarIcon size={48} strokeWidth={1} />
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }} 
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/20"
                >
                  <AlertCircle size={16} />
                </motion.div>
              </div>
              
              <div className="max-w-xs space-y-3">
                <h3 className="text-2xl font-black text-white tracking-tighter uppercase">No reservations scheduled</h3>
                <p className="text-sm text-white/40 font-medium leading-relaxed">
                  There are no bookings for <span className="text-amber-500">{format(selectedDate, 'eeee, dd MMMM yyyy')}</span>.
                </p>
              </div>

              <Button 
                onClick={() => onNewReservation?.()}
                className="h-14 bg-white/5 hover:bg-amber-500 text-white/60 hover:text-black font-black uppercase tracking-widest px-10 rounded-2xl border border-white/10 transition-all flex items-center gap-3"
              >
                <Plus size={18} />
                Make First Reservation
              </Button>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

const DetailItem = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center gap-4 group/item transition-all hover:translate-x-1">
    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-500 group-hover/item:bg-emerald-500/10 transition-colors">
       <Icon size={16} />
    </div>
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-0.5">{label}</p>
      <p className="text-sm font-black text-white tracking-tight">{value}</p>
    </div>
  </div>
);

const PreferenceBox = ({ title, items, color }: any) => (
  <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">{title}</p>
    <div className="flex flex-wrap gap-2">
      {items.map((item: string, i: number) => (
        <span key={i} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest", color)}>
          {item}
        </span>
      ))}
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, title, subtitle, children }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-[#121215] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl"
        >
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-br from-amber-500/10 to-transparent">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight uppercase">{title}</h3>
              {subtitle && <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-1">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 transition-all">
              <X size={20} />
            </button>
          </div>
          <div className="p-8">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default ReservationsView;

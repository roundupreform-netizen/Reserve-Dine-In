import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Users, MessageSquare, CheckCircle2, ChevronRight, Utensils } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { GlassCard, Button, Input, Label, cn } from '../components/ui/core';

const TIME_SLOTS = [
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"
];

const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function ReservationScreen() {
  const { user, logout } = useAuth();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState(2);
  const [specialRequest, setSpecialRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Determine session based on time
      const hour = parseInt(time.split(':')[0]);
      let session = 'Evening';
      if (hour < 12) session = 'Breakfast';
      else if (hour < 16) session = 'Lunch';
      else if (hour < 19) session = 'Evening';
      else session = 'Dinner';

      await addDoc(collection(db, 'reservations'), {
        userId: user.uid,
        guestName: user.displayName || 'Guest',
        date,
        time,
        guests,
        session,
        specialRequest,
        status: 'reserved',
        createdAt: serverTimestamp(),
      });
      setCompleted(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reservations');
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] text-white p-6 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-[0_20px_50px_rgba(16,185,129,0.4)]"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <h1 className="text-3xl font-bold mb-2">Reservation Placed!</h1>
        <p className="text-white/40 mb-8 max-w-xs">We've received your request. You'll receive a notification once confirmed.</p>
        <Button onClick={() => setCompleted(false)}>Return Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white pb-32">
      {/* Hero Header */}
      <div className="h-72 relative bg-[url('https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/40 to-transparent" />
        <div className="absolute top-6 right-6">
          <Button variant="ghost" onClick={logout} className="h-10 text-xs px-4">Sign Out</Button>
        </div>
        <div className="absolute bottom-10 left-8">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Utensils size={18} />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Everest Bistro</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tighter">Reserve Dine</h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6 -mt-12 relative z-10 space-y-6">
        <GlassCard className="space-y-10 border-white/[0.05] rounded-[2.5rem]">
          {/* Step 1: Date & Guests */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold tracking-tight">Booking Details</h2>
              <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest leading-none">Step 1/3</div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label>Select Date</Label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-4 text-emerald-500 group-focus-within:scale-110 transition-transform" size={18} />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full bg-white/5 border border-white/10 rounded-[1.25rem] pl-12 pr-4 py-4 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-sm font-medium transition-all"
                  />
                </div>
              </div>
              <div>
                <Label>Guests</Label>
                <div className="relative group">
                  <Users className="absolute left-4 top-4 text-emerald-500 group-focus-within:scale-110 transition-transform" size={18} />
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-[1.25rem] pl-12 pr-4 py-4 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 appearance-none text-sm font-medium transition-all"
                  >
                    {GUEST_OPTIONS.map(num => (
                      <option key={num} value={num} className="bg-[#121215]">{num} People</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Time Slots */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold tracking-tight">Prefered Time</h2>
              <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest leading-none">Step 2/3</div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {TIME_SLOTS.map(t => (
                <button
                  key={t}
                  onClick={() => setTime(t)}
                  className={cn(
                    "py-3.5 rounded-[1.25rem] border transition-all text-xs font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95",
                    time === t 
                      ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_10px_20px_rgba(16,185,129,0.3)]" 
                      : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Special Request */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold tracking-tight">Additional Info</h2>
              <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest leading-none">Step 3/3</div>
            </div>
            <div>
              <Label>Special Requests</Label>
              <textarea
                placeholder="Birthdays, allergies, or window seating preferences..."
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-[1.25rem] px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all h-28 resize-none text-sm"
              />
            </div>
          </div>

          <Button 
            className="w-full h-16 text-lg rounded-[1.5rem] mt-4" 
            disabled={!time || loading}
            onClick={handleSubmit}
          >
            {loading ? "Processing..." : "Complete Reservation"}
            <ChevronRight size={20} />
          </Button>
          
          <p className="text-[10px] text-center text-white/20 uppercase tracking-[0.2em] font-bold mt-4">
            Secured by Everest Developers
          </p>
        </GlassCard>
      </div>

      {/* Bottom Nav Simulation */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-[#0A0A0C]/80 backdrop-blur-2xl border-t border-white/[0.05] flex items-center justify-around px-8 z-50">
        <button className="flex flex-col items-center gap-1.5 text-emerald-500 group">
          <div className="w-12 h-1 bg-emerald-500 rounded-full absolute top-0" />
          <Utensils size={24} className="group-active:scale-90 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Reserve</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 text-white/20 hover:text-white/40 transition-colors">
          <Calendar size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Bookings</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 text-white/20 hover:text-white/40 transition-colors">
          <Users size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Profile</span>
        </button>
      </div>
    </div>
  );
}

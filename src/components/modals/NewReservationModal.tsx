import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Phone, Users, Calendar, Clock, MessageSquare, AlertCircle, Loader2, LayoutGrid, Tag, Coffee, Check, Share2, Download, MessageCircle, Globe, Share, Send, Search, Minus, Plus, ShoppingCart, Leaf, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, getDocs, doc, updateDoc } from 'firebase/firestore';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../../lib/firebase';
import { useOutlet } from '../../contexts/OutletContext';
import ValidationWarningModal from './ValidationWarningModal';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
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
  eachDayOfInterval,
  isToday,
  startOfToday,
  isBefore,
  parse,
  isEqual
} from 'date-fns';

/**
 * Checks if a combined date and time is in the past.
 */
const isDateTimePast = (dateStr: string, timeStr: string) => {
  if (!dateStr || !timeStr) return false;
  try {
    const selectedDateTime = parse(`${dateStr} ${timeStr}`, 'yyyy-MM-dd HH:mm', new Date());
    return isBefore(selectedDateTime, new Date());
  } catch (e) {
    return false;
  }
};

interface NewReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  initialData?: any;
}

const SECTIONS = [
  { id: 'sec-1', name: 'Main Floor', range: 'T1-T10', tables: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10'] },
  { id: 'sec-2', name: 'Window Area', range: 'W1-W5', tables: ['W1', 'W2', 'W3', 'W4', 'W5'] },
  { id: 'sec-3', name: 'VIP Lounge', range: 'V1-V4', tables: ['V1', 'V2', 'V3', 'V4'] },
  { id: 'sec-4', name: 'Terrace', range: 'R1-R8', tables: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'] },
];

const ALL_TABLES = SECTIONS.flatMap(s => s.tables);

interface PreOrderItem {
  itemId: string;
  name: string;
  price: number;
  qty: number;
  category: string;
  type: 'veg' | 'non-veg';
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isAvailable: boolean;
  type: 'veg' | 'non-veg';
}

interface InteractiveDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  onError: () => void;
}

const InteractiveDatePicker: React.FC<InteractiveDatePickerProps> = ({ value, onChange, onError }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const [isShaking, setIsShaking] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value) : null;
  const today = startOfToday();

  const handleDateSelect = (date: Date) => {
    const isPast = isBefore(date, today) && !isSameDay(date, today);
    if (isPast) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      onError();
      return;
    }
    onChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="relative" ref={popoverRef}>
      <motion.button
        type="button"
        id="interactive-date-picker"
        data-8848-id="interactive-date-picker"
        animate={isShaking ? { x: [-4, 4, -4, 4, 0], transition: { duration: 0.4 } } : { x: 0 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-12 bg-white/[0.03] border rounded-2xl pl-11 pr-4 text-sm text-white flex items-center justify-between outline-none transition-all group relative overflow-hidden",
          isShaking 
            ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]" 
            : "border-white/10 hover:border-white/20 focus:border-amber-500/50 focus:bg-white/[0.05]"
        )}
      >
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Calendar size={14} className={cn("absolute left-4 transition-colors", isShaking ? "text-red-500" : "text-white/20 group-hover:text-amber-500")} />
        <span className={cn("font-medium", value ? "text-white" : "text-white/20")}>
          {value ? format(new Date(value), 'PPP') : "Select date"}
        </span>
        <ChevronRight size={14} className={cn("text-white/20 transition-transform", isOpen && "rotate-90 text-amber-500")} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-0 right-0 md:left-auto md:right-0 mt-2 z-[110] bg-[#121215] border border-white/10 rounded-3xl p-4 shadow-2xl overflow-hidden min-w-[300px]"
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <h4 className="text-xs font-black uppercase tracking-widest text-white">
                {format(currentMonth, 'MMMM yyyy')}
              </h4>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-black text-white/20 p-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, idx) => {
                const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                const isPast = isBefore(date, today) && !isSameDay(date, today);
                const isCurrentMonth = isSameMonth(date, monthStart);

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isPast || !isCurrentMonth}
                    onClick={() => handleDateSelect(date)}
                    title={isPast ? "Past reservations are not allowed" : ""}
                    className={cn(
                      "h-9 rounded-xl flex items-center justify-center text-[11px] font-bold transition-all relative group",
                      !isCurrentMonth && "opacity-0 pointer-events-none",
                      isPast && "text-white/5 cursor-not-allowed bg-white/[0.01]",
                      isSelected 
                        ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                        : isCurrentMonth && !isPast && "hover:bg-white/5 text-white/60 hover:text-white"
                    )}
                  >
                    {format(date, 'd')}
                    {isToday(date) && !isSelected && (
                      <div className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-500" />
                    )}
                    {isPast && (
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black/80 text-[6px] text-white px-1 py-0.5 rounded whitespace-nowrap">PAST</div>
                       </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface StyledSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[] | { value: string; label: string; disabled?: boolean }[];
  icon: React.ReactNode;
  placeholder?: string;
  className?: string;
}

const StyledSelect: React.FC<StyledSelectProps> = ({ value, onChange, options, icon, placeholder, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayLabel = useMemo(() => {
    const option = options.find(o => typeof o === 'string' ? o === value : o.value === value);
    if (!option) return value || placeholder;
    return typeof option === 'string' ? option : option.label;
  }, [value, options, placeholder]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-12 bg-white/[0.03] border rounded-2xl pl-11 pr-4 text-sm text-white flex items-center justify-between outline-none transition-all group",
          !className && "border-white/10 focus:border-amber-500/50 focus:bg-white/[0.05] hover:border-white/20",
          className
        )}
      >
        <div className="absolute left-4 text-white/20 group-hover:text-amber-500 transition-colors">
          {icon}
        </div>
        <span className={cn("truncate mr-2", value ? "text-white" : "text-white/20")}>{displayLabel}</span>
        <ChevronRight size={14} className={cn("text-white/20 transition-transform shrink-0", isOpen && "rotate-90 text-amber-500")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-0 right-0 mt-2 z-[120] bg-[#121215] border border-white/10 rounded-2xl p-2 shadow-2xl overflow-hidden"
          >
            <div className="max-h-[200px] overflow-y-auto no-scrollbar space-y-1">
              {options.map((opt) => {
                const optValue = typeof opt === 'string' ? opt : opt.value;
                const optLabel = typeof opt === 'string' ? opt : opt.label;
                const isDisabled = typeof opt === 'string' ? false : opt.disabled;
                const isSelected = optValue === value;

                return (
                  <button
                    key={optValue}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      onChange(optValue);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl text-left text-sm font-bold transition-all flex items-center justify-between",
                      isSelected 
                        ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                        : isDisabled
                          ? "text-white/10 cursor-not-allowed bg-white/[0.01]"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <span className="truncate">{optLabel}</span>
                    {isDisabled && <span className="text-[8px] opacity-40 uppercase tracking-tighter">Past</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const NewReservationModal: React.FC<NewReservationModalProps> = ({ isOpen, onClose, initialDate, initialData }) => {
  const { user, userData } = useAuth();
  const { outlet } = useOutlet();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTimeShaking, setIsTimeShaking] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [availabilityStatus, setAvailabilityStatus] = useState<'checking' | 'available' | 'booked' | 'limited'>('available');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Auto-update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const triggerWarning = (msg: string = "Sorry! Can't make reservation for past date or time.") => {
    setWarningMessage(msg);
    setShowWarning(true);
  };
  const [sections, setSections] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [vegOnly, setVegOnly] = useState(false);
  const [reservationId, setReservationId] = useState('');
  const [existingReservations, setExistingReservations] = useState<any[]>([]);
  const ticketRef = React.useRef<HTMLDivElement>(null);

  // Fetch real setup from Firestore
  useEffect(() => {
    if (!isOpen || !user) return;

    // Sections
    const qSections = query(collection(db, 'sections'));
    const unsubSections = onSnapshot(qSections, (snap) => {
      setSections(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.warn("Sections load failed:", error.message);
    });

    // Tables
    const qTables = query(collection(db, 'tables'));
    const unsubTables = onSnapshot(qTables, (snap) => {
      setTables(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.warn("Tables load failed:", error.message);
    });

    return () => {
      unsubSections();
      unsubTables();
    };
  }, [isOpen, user]);

  const ALL_TABLE_IDS = useMemo(() => tables.map(t => t.id || t.name), [tables]);

  const [formData, setFormData] = useState({
    salutation: 'Mr.',
    guestName: '',
    email: '',
    phone: '',
    guests: '2',
    date: initialDate || new Date().toISOString().split('T')[0],
    time: '19:00',
    session: 'Dinner',
    reservationType: 'single', // 'single', 'multiple', 'section'
    selectedTables: [] as string[],
    sectionId: '',
    notes: '',
    internalNotes: '',
    diningPreferences: [] as string[],
    foodPreferences: [] as string[],
    specialRequests: '',
    preorderItems: [] as PreOrderItem[],
    tags: [] as string[],
    totalAmount: 0,
    totalItems: 0,
    status: 'Confirmed',
    isVIP: false
  });

  const categories = ['All', 'Starters', 'Main Course', 'Desserts', 'Drinks', 'High Tea', 'Beverages'];

  // Re-sync date when initialDate or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...initialData,
          guests: initialData.guests?.toString() || '2',
        });
        setStep(1);
      } else if (initialDate) {
        setFormData(prev => ({ ...prev, date: initialDate }));
      }
    }
    if (!isOpen) {
      setStep(1);
      setSuccess(false);
    }
  }, [initialDate, initialData, isOpen]);

  useEffect(() => {
    if (!isOpen || !user || !userData) return;
    
    // Fetch Menu Items
    const qMenu = query(collection(db, 'menuItems'), where('isAvailable', '==', true));
    const unsubMenu = onSnapshot(qMenu, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem));
      if (items.length === 0) {
        // Fallback mockup if database is empty - following user's menu structure
        setMenuItems([
          { id: '1', name: 'Chicken Biryani', category: 'Main Course', price: 450, isAvailable: true, type: 'non-veg' },
          { id: '2', name: 'Paneer Tikka', category: 'Starters', price: 320, isAvailable: true, type: 'veg' },
          { id: '3', name: 'Truffle Pasta', category: 'Main Course', price: 580, isAvailable: true, type: 'veg' },
          { id: '4', name: 'Chocolate Lava Cake', category: 'Desserts', price: 250, isAvailable: true, type: 'veg' },
          { id: '5', name: 'Vintage Red Wine', category: 'Beverages', price: 1200, isAvailable: true, type: 'veg' },
          { id: '6', name: 'Cold Coffee', category: 'Beverages', price: 180, isAvailable: true, type: 'veg' },
        ]);
      } else {
        setMenuItems(items);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'menuItems');
    });

    // Fetch reservations for the selected date to hide/disable tables
    const qReservations = query(collection(db, 'reservations'), where('date', '==', formData.date));
    const unsubRes = onSnapshot(qReservations, (snap) => {
      setExistingReservations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reservations');
    });

    return () => {
      unsubMenu();
      unsubRes();
    };
  }, [formData.date, isOpen, user, userData]);

  const bookedTables = useMemo(() => {
    return existingReservations
      .filter(r => r.session === formData.session)
      .flatMap(r => r.selectedTables || [r.tableSelection]);
  }, [existingReservations, formData.session]);

  // Real-time Availability Logic Simulation
  useEffect(() => {
    if ((step === 2 || step === 3) && formData.date) {
      setIsCheckingAvailability(true);
      setAvailabilityStatus('checking');
      
      const timer = setTimeout(() => {
        // Logic: Check if selected tables are still available
        const isTableStillAvailable = formData.selectedTables.every(t => !bookedTables.includes(t));
        const bookingRatio = bookedTables.length / ALL_TABLES.length;

        if (!isTableStillAvailable && formData.selectedTables.length > 0) {
          setAvailabilityStatus('booked');
        } else if (bookingRatio > 0.8) {
          setAvailabilityStatus('limited');
        } else {
          setAvailabilityStatus('available');
        }
        setIsCheckingAvailability(false);
      }, 800); // Simulated delay for "real-time" feel

      return () => clearTimeout(timer);
    }
  }, [formData.date, formData.time, formData.session, formData.selectedTables, bookedTables, step]);

  const handleSubmit = async () => {
    // Re-validate just in case
    if (isDateTimePast(formData.date, formData.time)) {
      triggerWarning();
      return;
    }

    setLoading(true);
    try {
      const reservationData = {
        ...formData,
        userId: user?.uid,
        guests: parseInt(formData.guests),
        preorders: formData.preorderItems.map(i => `${i.qty}x ${i.name}`).join(', '), // Compatibility with ticket view
        updatedAt: serverTimestamp()
      };
      
      if (initialData?.id) {
        await updateDoc(doc(db, 'reservations', initialData.id), reservationData);
        setReservationId(initialData.id);
      } else {
        const docRef = await addDoc(collection(db, 'reservations'), {
          ...reservationData,
          createdAt: serverTimestamp()
        });
        setReservationId(docRef.id);
      }
      setSuccess(true);
    } catch (error) {
      console.error("Error saving reservation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableToggle = (table: string) => {
    if (bookedTables.includes(table)) return;

    if (formData.reservationType === 'single') {
      setFormData(prev => ({ ...prev, selectedTables: [table] }));
    } else {
      setFormData(prev => ({
        ...prev,
        selectedTables: prev.selectedTables.includes(table)
          ? prev.selectedTables.filter(t => t !== table)
          : [...prev.selectedTables, table]
      }));
    }
  };

  const handleSectionSelect = (section: any) => {
    const sectionTables = tables.filter(t => t.sectionId === section.id).map(t => t.id || t.name);
    setFormData(prev => ({
      ...prev,
      sectionId: section.id,
      selectedTables: sectionTables
    }));
  };

  const handleUpdatePreorder = (item: MenuItem, delta: number) => {
    setFormData(prev => {
      const existing = prev.preorderItems.find(i => i.itemId === item.id);
      let newItems = [...prev.preorderItems];

      if (existing) {
        if (existing.qty + delta <= 0) {
          newItems = newItems.filter(i => i.itemId !== item.id);
        } else {
          newItems = newItems.map(i => i.itemId === item.id ? { ...i, qty: i.qty + delta } : i);
        }
      } else if (delta > 0) {
        newItems.push({
          itemId: item.id,
          name: item.name,
          price: item.price,
          qty: 1,
          category: item.category,
          type: item.type
        });
      }

      const totalAmount = newItems.reduce((acc, i) => acc + (i.price * i.qty), 0);
      const totalItems = newItems.reduce((acc, i) => acc + i.qty, 0);

      return { ...prev, preorderItems: newItems, totalAmount, totalItems };
    });
  };

  const filteredMenu = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesVeg = !vegOnly || item.type === 'veg';
      return matchesSearch && matchesCategory && matchesVeg;
    });
  }, [menuItems, menuSearch, selectedCategory, vegOnly]);

  const nextStep = () => {
    if (step === 1) {
      if (!formData.date || !formData.session || !formData.reservationType || formData.selectedTables.length === 0) return;
    }
    if (step === 2) {
      if (!formData.guestName.trim() || !formData.time || !formData.guests || !formData.phone.trim()) return;
      
      // Final validation before leaving guest details step
      if (isDateTimePast(formData.date, formData.time)) {
        setIsTimeShaking(true);
        setTimeout(() => setIsTimeShaking(false), 500);
        triggerWarning();
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const isStepValid = useMemo(() => {
    if (step === 1) {
      return formData.date && formData.session && formData.reservationType && formData.selectedTables.length > 0 && availabilityStatus !== 'booked';
    }
    if (step === 2) {
      return formData.guestName.trim() && formData.time && formData.guests && formData.phone.trim() && !isDateTimePast(formData.date, formData.time) && availabilityStatus !== 'booked';
    }
    if (step === 3) return !isDateTimePast(formData.date, formData.time) && availabilityStatus !== 'booked';
    return false;
  }, [step, formData, availabilityStatus]);

  // Prevent past time selection automatically
  useEffect(() => {
    if (formData.date && formData.time && isDateTimePast(formData.date, formData.time)) {
      // If it's today and time is past, we don't automatically reset because it's jarring, 
      // but we disable progress via isStepValid.
      // However, if date is in the past, reset date to today.
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      if (isBefore(parse(formData.date, 'yyyy-MM-dd', new Date()), startOfToday())) {
         setFormData(prev => ({ ...prev, date: todayStr }));
      }
    }
  }, [formData.date, formData.time]);
  const prevStep = () => setStep(prev => prev - 1);

  const handleDownloadImage = async () => {
    if (!ticketRef.current) return;
    try {
      const dataUrl = await toPng(ticketRef.current, { cacheBust: true, backgroundColor: '#0a0a0c' });
      const link = document.createElement('a');
      link.download = `Reservation-${formData.guestName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    }
  };

  const handleDownloadPDF = async () => {
    if (!ticketRef.current) return;
    try {
      const dataUrl = await toPng(ticketRef.current, { cacheBust: true, backgroundColor: '#0a0a0c' });
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Reservation-${formData.guestName}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
    }
  };

  const shareToPlatform = (platform: string) => {
    const tables = formData.reservationType === 'section' ? `Section ${formData.sectionId}` : formData.selectedTables.join(', ');
    const formattedDate = new Date(formData.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const maskedPhone = `********${formData.phone.slice(-2)}`;
    const emailInfo = formData.email ? `\nEmail: ${formData.email}` : '';
    
    let text = `${formData.session} reservation confirmed!\nDate: ${formattedDate}\nat ${outlet?.name || 'Everest Fine dine'}\nHost name: ${formData.salutation} ${formData.guestName}\nPhone no: ${maskedPhone}${emailInfo}\nNo of guest: ${formData.guests}\ntime of arrival: ${formData.time}`;
    
    if (formData.preorderItems.length > 0) {
      text += `\n\npreorders like:\n${formData.preorderItems.map(i => `${i.name} x${i.qty}`).join('\n')}`;
    }
    
    const encodedText = encodeURIComponent(text);
    
    switch(platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
        break;
      case 'messenger':
        alert('Sharing details to clipboard for Messenger...');
        navigator.clipboard.writeText(text);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodedText}`, '_blank');
        break;
      default:
        navigator.clipboard.writeText(text);
        alert('Reservation details copied to clipboard!');
    }
  };

  const inputClasses = "w-full h-12 bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 text-sm text-white focus:border-amber-500/50 focus:bg-white/[0.05] outline-none transition-all placeholder:text-white/20 hover:border-white/20";
  const labelClasses = "text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 mb-2 block";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl bg-[#0a0a0c] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header / Progress */}
            <div className="p-8 border-b border-white/5 bg-gradient-to-r from-amber-500/10 to-transparent">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black tracking-tighter text-white">
                    {success ? "Booking Confirmed" : step === 1 ? "Choose Seating" : step === 2 ? "Guest Details" : "Review & Pre-Order"}
                  </h2>
                  {!success && (
                    <p className="text-xs text-white/40 font-medium">Step {step} of {totalSteps} • {
                      step === 1 ? "Select date and tables" : 
                      step === 2 ? "Enter host information" : 
                      "Finalize your reservation"
                    }</p>
                  )}
                </div>
                <button 
                  onClick={() => {
                    setSuccess(false);
                    setReservationId('');
                    onClose();
                  }}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {!success && (
                <div className="flex gap-2">
                  {[1, 2, 3].map(s => (
                    <div 
                      key={s} 
                      className={cn(
                        "h-1 flex-1 rounded-full transition-all duration-500",
                        s <= step ? "bg-amber-500" : "bg-white/10"
                      )} 
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Content View */}
            <div className="max-h-[75vh] overflow-y-auto no-scrollbar relative">
              {/* Floating Live Indicator */}
              {!success && (
                <div className="sticky top-0 z-[60] bg-black/60 backdrop-blur-md border-b border-white/5 px-8 py-2 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Calendar size={10} className="text-amber-500" />
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Today: {format(currentTime, 'dd MMM yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={10} className="text-amber-500" />
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Live: {format(currentTime, 'hh:mm a')}</span>
                  </div>
                </div>
              )}
              {success ? (
                <div className="p-8 space-y-8">
                  <div className="flex justify-center flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                      <Check size={40} className="stroke-[3]" />
                    </div>
                    
                    <div ref={ticketRef} className="w-full max-w-sm bg-[#fafafa] border border-black/5 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden shadow-2xl">
                      <div className="flex flex-col items-center text-center space-y-2 pb-6 border-b border-black/5">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                          <Check size={32} className="stroke-[3]" />
                        </div>
                        <h2 className="text-3xl font-black text-[#0f172a] leading-none tracking-tight">
                          {formData.session} <br />
                          <span className="text-[#0f172a]">Reservation Confirmed!</span>
                        </h2>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#64748b]">
                          {outlet?.name || "Everest D'Hotel Fine Dining"}
                        </p>
                        <div className="flex items-center gap-2 justify-center mt-1">
                          <div className="h-px w-3 bg-gradient-to-r from-transparent to-emerald-500/30" />
                          <p className="text-[8px] font-black uppercase tracking-[0.4em] bg-gradient-to-r from-emerald-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent animate-gradient-x">
                            CONFIRMATION VOUCHER
                          </p>
                          <div className="h-px w-3 bg-gradient-to-l from-transparent to-emerald-500/30" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-6 gap-x-4 pt-4">
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">Host Name</h4>
                          <p className="text-sm font-black text-[#0f172a]">{formData.salutation} {formData.guestName}</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">Phone No</h4>
                          <p className="text-sm font-black text-[#0f172a]">********{formData.phone.slice(-2)}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">E-mail</h4>
                          <p className="text-sm font-black text-[#0f172a] truncate max-w-[150px]">{formData.email || "N/A"}</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">Date</h4>
                          <p className="text-sm font-black text-[#0f172a]">
                            {new Date(formData.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">Time of Arrival</h4>
                          <p className="text-sm font-black text-amber-600">{formData.time} ({formData.session})</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">No of Guest</h4>
                          <p className="text-sm font-black text-[#0f172a]">{formData.guests} PAX</p>
                        </div>

                        <div className="col-span-2 pt-4 border-t border-black/5 text-center space-y-1">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#94a3b8]">Assigned Table</h4>
                          <p className="text-xl font-black text-emerald-600">
                            {formData.reservationType === 'section' ? 'Full Section Reserved' : `TABLE ${formData.selectedTables.join(', ') || 'PENDING'}`}
                          </p>
                        </div>
                      </div>

                      {formData.preorderItems.length > 0 && (
                        <div className="mt-8 pt-8 border-t border-dashed border-black/10 space-y-4">
                           <div className="flex items-center gap-3 justify-center">
                             <div className="h-px w-8 bg-black/5" />
                             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600">Pre-Order Summary</h4>
                             <div className="h-px w-8 bg-black/5" />
                           </div>
                           <div className="space-y-2">
                              {formData.preorderItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center px-4 py-2.5 bg-white border border-black/[0.03] rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.01)] transition-all hover:border-amber-500/20">
                                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center text-[9px] font-black">{item.qty}×</span>
                                    {item.name}
                                  </span>
                                  <span className="text-[10px] font-black text-slate-400">₹{item.price * item.qty}</span>
                                </div>
                              ))}
                           </div>
                           <div className="pt-2 border-t border-amber-500/10 flex justify-between items-center px-2">
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Total Pre-Order</span>
                              <span className="text-xs font-black text-amber-600 tracking-tighter">₹{formData.totalAmount}</span>
                           </div>
                        </div>
                      )}

                      <div className="pt-8 flex flex-col items-center gap-4">
                         <div className="w-32 h-32 bg-white border border-slate-100 rounded-2xl flex items-center justify-center p-2">
                            {/* Placeholder for QR/Placeholder icon */}
                            <div className="w-full h-full bg-slate-50 rounded-xl flex items-center justify-center">
                               <Share2 className="text-slate-200" size={32} />
                            </div>
                         </div>
                         <p className="text-[9px] font-black text-[#94a3b8] uppercase tracking-[0.3em]">Scan at Reception</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                        <p className={labelClasses}>Download Options</p>
                        <div className="grid grid-cols-2 gap-4">
                           <button onClick={handleDownloadImage} className="h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-white transition-all border border-white/5">
                             <Download size={14} className="text-amber-500" />
                             Download PNG
                           </button>
                           <button onClick={handleDownloadPDF} className="h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-white transition-all border border-white/5">
                             <Download size={14} className="text-amber-500" />
                             Download PDF
                           </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className={labelClasses}>Share with Platforms</p>
                        <div className="grid grid-cols-4 gap-4">
                           <button onClick={() => shareToPlatform('whatsapp')} className="h-14 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center transition-all">
                              <MessageCircle size={22} />
                           </button>
                           <button onClick={() => shareToPlatform('instagram')} className="h-14 bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 rounded-2xl flex items-center justify-center transition-all">
                              <Globe size={22} />
                           </button>
                           <button onClick={() => shareToPlatform('facebook')} className="h-14 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center transition-all">
                              <Share size={22} />
                           </button>
                           <button onClick={() => shareToPlatform('messenger')} className="h-14 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 rounded-2xl flex items-center justify-center transition-all">
                              <Send size={22} />
                           </button>
                        </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 space-y-8">
                  {step === 1 && (
                    <div className="space-y-8">
                      {/* Date and Session Selection combined with Seating */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className={labelClasses}>Reservation Date *</label>
                          <InteractiveDatePicker 
                            value={formData.date} 
                            onChange={date => setFormData({...formData, date})} 
                            onError={() => triggerWarning("Past dates are not allowed for reservations.")}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={labelClasses}>Session *</label>
                          <StyledSelect 
                            value={formData.session} 
                            onChange={value => setFormData({...formData, session: value})}
                            options={['Breakfast', 'Lunch', 'Snacks', 'Evening', 'Dinner']}
                            icon={<AlertCircle size={14} />}
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                          <div className="flex gap-1.5 p-1 bg-white/[0.02] border border-white/5 rounded-2xl">
                            {[
                              { id: 'single', label: 'Single', icon: User },
                              { id: 'multiple', label: 'Multi', icon: Users },
                              { id: 'section', label: 'Full Section', icon: LayoutGrid }
                            ].map(type => (
                              <button
                                key={type.id}
                                onClick={() => setFormData({...formData, reservationType: type.id, selectedTables: []})}
                                className={cn(
                                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                  formData.reservationType === type.id 
                                    ? "bg-amber-500 text-black shadow-lg" 
                                    : "text-white/20 hover:text-white/40"
                                )}
                              >
                                <type.icon size={12} />
                                {type.label}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-2">
                            {isCheckingAvailability ? (
                              <Loader2 size={12} className="text-amber-500 animate-spin" />
                            ) : (
                              <div className={cn("w-2 h-2 rounded-full", 
                                availabilityStatus === 'available' ? "bg-emerald-500" :
                                availabilityStatus === 'limited' ? "bg-amber-500" : "bg-red-500"
                              )} />
                            )}
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
                              {isCheckingAvailability ? "Syncing..." : availabilityStatus}
                            </span>
                          </div>
                        </div>

                        {formData.reservationType === 'section' ? (
                          <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto no-scrollbar">
                            {sections.map(sec => {
                              const isSelected = formData.sectionId === sec.id;
                              const sectionTables = tables.filter(t => t.sectionId === sec.id);
                              const isBusy = sectionTables.some(t => bookedTables.includes(t.id || t.name));
                              return (
                                <button
                                  key={sec.id}
                                  disabled={isBusy}
                                  onClick={() => handleSectionSelect(sec)}
                                  className={cn(
                                    "p-5 rounded-3xl border transition-all text-left flex justify-between items-center group",
                                    isSelected ? "bg-amber-500/10 border-amber-500" : "bg-white/[0.02] border-white/5 hover:border-amber-500/20",
                                    isBusy && "opacity-50 cursor-not-allowed grayscale"
                                  )}
                                >
                                  <div>
                                    <h4 className="text-sm font-black text-white group-hover:text-amber-500 transition-colors">{sec.name}</h4>
                                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-1">{sectionTables.length} Tables available</p>
                                  </div>
                                  {isBusy ? (
                                    <span className="text-[8px] font-black bg-red-500/10 text-red-500 px-2 py-1 rounded-full uppercase tracking-tighter">Fully Booked</span>
                                  ) : (
                                    <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all", isSelected ? "border-amber-500 bg-amber-500" : "border-white/10")}>
                                      {isSelected && <Check size={14} className="text-black" />}
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-6 max-h-[350px] overflow-y-auto no-scrollbar pr-1">
                            {sections.map(sec => (
                              <div key={sec.id} className="space-y-3">
                                <h5 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 ml-2">{sec.name}</h5>
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                                  {tables.filter(t => t.sectionId === sec.id).map(table => {
                                    const tableId = table.id || table.name;
                                    const isSelected = formData.selectedTables.includes(tableId);
                                    const isBooked = bookedTables.includes(tableId);
                                    return (
                                      <button
                                        key={tableId}
                                        disabled={isBooked}
                                        onClick={() => handleTableToggle(tableId)}
                                        className={cn(
                                          "h-14 rounded-2xl border flex flex-col items-center justify-center transition-all relative overflow-hidden",
                                          isBooked ? "bg-red-500/5 border-red-500/10 text-red-500 opacity-40 cursor-not-allowed" :
                                          isSelected ? "bg-amber-500 text-black border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]" :
                                          "bg-white/[0.02] border-white/5 text-white/40 hover:border-amber-500/50 hover:text-white"
                                        )}
                                      >
                                        <span className="text-[11px] font-black">{table.name}</span>
                                        <span className={cn("text-[7px] font-black uppercase tracking-tighter", isSelected ? "text-black/60" : "opacity-30")}>{table.capacity}P</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className={labelClasses}>Host Details *</label>
                          <div className="flex gap-2">
                            <StyledSelect 
                              className="w-28"
                              value={formData.salutation}
                              onChange={value => setFormData({...formData, salutation: value})}
                              options={['Mr.', 'Mrs.', 'Ms.', 'Dr.']}
                              icon={<User size={12} />}
                            />
                            <div className="flex-1 relative">
                              <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                              <input 
                                required 
                                type="text" 
                                className={inputClasses} 
                                value={formData.guestName} 
                                onChange={e => setFormData({...formData, guestName: e.target.value})} 
                                placeholder="Guest Name" 
                              />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className={labelClasses}>Phone *</label>
                          <div className="relative">
                            <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                            <input required type="tel" className={inputClasses} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91 00000 00000" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className={labelClasses}>Arrival Time *</label>
                          <div className="relative">
                            <motion.div animate={isTimeShaking ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }}>
                              <StyledSelect 
                                value={formData.time} 
                                onChange={value => setFormData({...formData, time: value})}
                                options={Array.from({ length: 48 }).map((_, i) => {
                                  const hour = Math.floor(i / 2);
                                  const min = (i % 2) * 30;
                                  const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                                  const isPast = isDateTimePast(formData.date, timeStr);
                                  return { 
                                    value: timeStr, 
                                    label: `${hour % 12 || 12}:${min.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`,
                                    disabled: isPast
                                  };
                                })}
                                icon={<Clock size={12} className="text-white/20" />}
                              />
                            </motion.div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className={labelClasses}>Party Size *</label>
                          <StyledSelect 
                            value={formData.guests} 
                            onChange={value => setFormData({...formData, guests: value})}
                            options={[1,2,3,4,5,6,7,8,10,12,15,20,30,50].map(n => ({ value: String(n), label: `${n} PAX` }))}
                            icon={<Users size={12} />}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className={labelClasses}>E-mail (Optional)</label>
                        <div className="relative">
                          <MessageSquare size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                          <input type="email" className={inputClasses} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="host@email.com" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className={labelClasses}>Internal Notes & Requests</label>
                        <div className="relative">
                          <textarea 
                            className={cn(inputClasses, "h-24 py-4 resize-none")} 
                            value={formData.notes} 
                            onChange={e => setFormData({...formData, notes: e.target.value})} 
                            placeholder="Add allergies, special occasions or table preferences..." 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-8">
                       <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-6 space-y-6">
                          <div className="flex justify-between items-center bg-white/[0.05] p-4 rounded-2xl border border-white/5">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black">
                                   {formData.guests}
                                </div>
                                <div>
                                   <p className="text-xs font-black text-white leading-none">{formData.salutation} {formData.guestName}</p>
                                   <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest">{formData.date} @ {formData.time}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Seating</p>
                                <p className="text-[10px] font-black text-amber-500 uppercase">
                                  {formData.reservationType === 'section' ? 'Full Section' : `Tables: ${formData.selectedTables.join(', ')}`}
                                </p>
                             </div>
                          </div>

                          <div className="space-y-4">
                             <div className="flex items-center justify-between px-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                                  <ShoppingCart size={12} />
                                  Pre-Order Menu (Optional)
                                </h4>
                                <div className="relative flex-1 max-w-[150px] ml-4">
                                  <Search size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                                  <input 
                                    className="w-full bg-white/5 border border-white/5 rounded-xl h-8 pl-8 pr-2 text-[10px] outline-none focus:border-amber-500/50" 
                                    placeholder="Fast pick..."
                                    value={menuSearch}
                                    onChange={e => setMenuSearch(e.target.value)}
                                  />
                                </div>
                             </div>

                             <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto no-scrollbar pr-1">
                                {filteredMenu.slice(0, 10).map(item => {
                                  const quantity = formData.preorderItems.find(i => i.itemId === item.id)?.qty || 0;
                                  return (
                                    <div key={item.id} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5 group border-transparent hover:border-amber-500/20 transition-all">
                                      <div className="flex items-center gap-3">
                                        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", item.type === 'veg' ? "bg-emerald-500" : "bg-red-500")} />
                                        <span className="text-xs font-bold text-white/70">{item.name} <span className="text-[10px] text-white/20 ml-2">₹{item.price}</span></span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        {quantity > 0 && (
                                          <button onClick={() => handleUpdatePreorder(item, -1)} className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-white/40"><Minus size={12} /></button>
                                        )}
                                        <span className={cn("text-[11px] font-black min-w-[14px] text-center", quantity > 0 ? "text-amber-500" : "text-white/10")}>{quantity}</span>
                                        <button onClick={() => handleUpdatePreorder(item, 1)} className="w-6 h-6 rounded-lg bg-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/20"><Plus size={12} /></button>
                                      </div>
                                    </div>
                                  );
                                })}
                             </div>
                          </div>

                          {formData.totalItems > 0 && (
                            <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-black flex items-center justify-center">
                                     <Check size={16} />
                                  </div>
                                  <div>
                                     <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">Pre-order Total</p>
                                     <p className="text-xs font-black text-white mt-1">{formData.totalItems} Items Added</p>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <p className="text-xl font-black text-white tracking-tighter">₹{formData.totalAmount}</p>
                               </div>
                            </div>
                          )}
                       </div>

                       <div className="flex items-center gap-4 p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                          <AlertCircle className="text-amber-500 shrink-0" size={16} />
                          <p className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest leading-relaxed">
                            Tables are held for 15 mins. No-show without notice may result in cancellation.
                          </p>
                       </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer / Navigation */}
            {!success && (
              <div className="p-8 border-t border-white/5 flex gap-4 bg-black/40">
                {step > 1 && (
                  <button
                    onClick={prevStep}
                    className="flex-1 h-14 rounded-2xl border border-white/5 text-white font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                  >
                    Back
                  </button>
                )}
                <button
                  id="res-modal-action-btn"
                  data-8848-id="res-modal-action-btn"
                  disabled={loading || !isStepValid}
                  onClick={step === 3 ? handleSubmit : nextStep}
                  className={cn(
                    "flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl",
                    isStepValid ? "bg-amber-500 text-black hover:bg-amber-600" : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                  )}
                >
                  {loading ? <Loader2 className="animate-spin" /> : (
                    <>
                      {step === 3 ? "Confirm Reservation" : "Continue"}
                    </>
                  )}
                </button>
              </div>
            )}
        </motion.div>
        </div>
      )}
      <ValidationWarningModal 
        isOpen={showWarning} 
        onClose={() => setShowWarning(false)} 
        message={warningMessage}
      />
    </AnimatePresence>
  );
};

export default NewReservationModal;


import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Download, 
  Share2, 
  Printer, 
  Mail, 
  Copy, 
  Check, 
  Loader2,
  Calendar,
  Clock,
  Users,
  MapPin,
  Utensils,
  Smartphone,
  Info
} from 'lucide-react';
import { generateQRPayload } from '../../utils/qrGenerator';
import { generateVoucherImage, downloadImage, shareToWhatsApp } from '../../utils/voucherUtils';

interface ReservationVoucherProps {
  reservation: any;
  isOpen: boolean;
  onClose: () => void;
}

const ReservationVoucher: React.FC<ReservationVoucherProps> = ({ reservation, isOpen, onClose }) => {
  const voucherRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!reservation) return null;

  const handleDownload = async () => {
    if (!voucherRef.current) return;
    setIsGenerating(true);
    const dataUrl = await generateVoucherImage(voucherRef.current);
    if (dataUrl) {
      downloadImage(dataUrl, `reservation-${reservation.id.slice(-6)}.png`);
    }
    setIsGenerating(false);
  };

  const handleWhatsAppShare = async () => {
    if (!voucherRef.current) return;
    setIsGenerating(true);
    
    // Attempt to download then share message
    const dataUrl = await generateVoucherImage(voucherRef.current);
    if (dataUrl) {
      // Direct download as fallback/parallel
      downloadImage(dataUrl, `voucher-${reservation.id.slice(-6)}.png`);
      
      const message = `Hi ${reservation.guestName}! Your reservation at LUXE DINING is confirmed.\n\n📅 Date: ${reservation.date}\n⏰ Time: ${reservation.time}\n👥 Guests: ${reservation.guests}\n📍 Table: ${reservation.selectedTables?.join(', ') || 'TBD'}\n\nI've attached your digital voucher. See you soon!`;
      
      // Share text and open WhatsApp
      shareToWhatsApp(reservation.phone, message);
      setSuccessMessage('Voucher Generated & WhatsApp Launched');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setIsGenerating(false);
  };

  const handleEmailVoucher = () => {
    const subject = encodeURIComponent(`Reservation Confirmation - ${reservation.guestName}`);
    const body = encodeURIComponent(`Hello ${reservation.guestName},\n\nYour reservation at LUXE DINING is confirmed.\n\nDate: ${reservation.date}\nTime: ${reservation.time}\nGuests: ${reservation.guests}\n\nYou can view your voucher here: ${window.location.origin}/r/${reservation.id}\n\nSee you soon!`);
    window.location.href = `mailto:${reservation.email || ''}?subject=${subject}&body=${body}`;
    setSuccessMessage('Email Client Launched');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/r/${reservation.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setSuccessMessage('Link Copied to Clipboard');
    setTimeout(() => {
      setCopied(false);
      setSuccessMessage(null);
    }, 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
          />
          
          <AnimatePresence>
            {successMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] bg-emerald-500 text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-[0_0_50px_rgba(16,185,129,0.3)] flex items-center gap-3"
              >
                <Check size={18} />
                {successMessage}
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="relative flex flex-col lg:flex-row gap-8 max-w-6xl w-full max-h-[95vh] overflow-y-auto no-scrollbar py-8">
            {/* --- The Voucher Card --- */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="flex-1 flex items-center justify-center p-4 lg:p-0"
            >
              <div 
                ref={voucherRef}
                id="reservation-voucher"
                className="w-full max-w-[420px] bg-[#030303] border border-white/5 rounded-[2.5rem] overflow-hidden relative shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col font-sans"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-emerald-500 opacity-30" />
                
                <div className="p-8 space-y-8">
                  {/* Status & Header */}
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                      <Check size={32} className="stroke-[3]" />
                    </div>
                    
                    <div className="space-y-1">
                      <h2 className="text-3xl font-black text-white leading-[0.9] tracking-tighter">
                        {reservation.session || 'Dinner'} <br />
                        Reservation <br />
                        <span className="text-white">Confirmed!</span>
                      </h2>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 pt-2">
                        EVEREST FINE DINE
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full justify-center">
                      <div className="h-px flex-1 bg-white/5" />
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-400">Confirmation Voucher</span>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>
                  </div>

                  {/* Main Details Grid */}
                  <div className="grid grid-cols-2 gap-y-8 gap-x-12 px-2">
                    <div className="space-y-1">
                      <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Host Name</h4>
                      <p className="text-sm font-black text-white/80">{reservation.salutation || 'Mr.'} {reservation.guestName}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Phone No</h4>
                      <p className="text-sm font-black text-white/80">********{reservation.phone ? reservation.phone.slice(-2) : '00'}</p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">E-mail</h4>
                      <p className="text-sm font-black text-white/80 truncate max-w-[140px] lowercase">{reservation.email || 'guest@email.com'}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Date</h4>
                      <p className="text-sm font-black text-white/80">
                        {reservation.date ? new Date(reservation.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '09 May 2026'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Time of Arrival</h4>
                      <p className="text-sm font-black text-amber-500">{reservation.time || '19:00'} ({reservation.session || 'Dinner'})</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">No of Guest</h4>
                      <p className="text-sm font-black text-white/80 uppercase">{reservation.guests || '2'} Pax</p>
                    </div>
                  </div>

                  {/* Table Status */}
                  <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center space-y-1">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">Assigned Table</h4>
                    <p className="text-2xl font-black text-emerald-500 uppercase tracking-tight">
                      TABLE {reservation.selectedTables?.join(', ') || reservation.tableId || 'T2'}
                    </p>
                  </div>

                  {/* Pre-order Summary */}
                  {reservation.preorderItems && reservation.preorderItems.length > 0 ? (
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center gap-3 w-full justify-center">
                        <div className="h-px w-8 bg-white/5" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-500">Pre-order Summary</span>
                        <div className="h-px w-8 bg-white/5" />
                      </div>
                      
                      <div className="space-y-2">
                        {reservation.preorderItems.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 text-[10px] font-black">
                                {item.qty}×
                              </div>
                              <span className="text-xs font-bold text-white/80">{item.name}</span>
                            </div>
                            <span className="text-[10px] font-black text-white/40 tracking-tighter">₹{item.price * item.qty}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center px-2">
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Total Pre-order</span>
                        <span className="text-sm font-black text-amber-500">₹{reservation.totalAmount || 0}</span>
                      </div>
                    </div>
                  ) : reservation.preorders ? (
                    // Logic for pre-orders stored as string (legacy/compatibility)
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center gap-3 w-full justify-center">
                        <div className="h-px w-8 bg-white/5" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-500">Service Notes</span>
                        <div className="h-px w-8 bg-white/5" />
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                        <p className="text-[11px] text-white/60 leading-relaxed italic">{reservation.preorders}</p>
                      </div>
                    </div>
                  ) : null}

                  {/* QR Footer */}
                  <div className="flex flex-col items-center space-y-4 pt-4">
                    <div className="p-4 bg-white/95 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                      <QRCodeSVG 
                        value={generateQRPayload(reservation)}
                        size={120}
                        level="H"
                        includeMargin={false}
                      />
                      <div className="absolute inset-0 bg-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-[2px]">
                         <Share2 className="text-black/20" size={24} />
                      </div>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Scan at Reception</p>
                  </div>
                </div>

                {/* Bottom Graphic */}
                <div className="h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
              </div>
            </motion.div>

            {/* --- Actions Panel --- */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              className="lg:w-[400px] flex flex-col justify-center gap-4"
            >
              <div className="bg-[#121215] border border-white/10 rounded-[2.5rem] p-10 space-y-8">
                <header>
                    <h3 className="text-2xl font-black text-white tracking-tight uppercase">Voucher Actions</h3>
                    <p className="text-xs text-white/40 mt-1">Generate and share premium reservation confirmations</p>
                </header>

                <div className="space-y-4">
                  <ActionButton 
                    icon={isGenerating ? Loader2 : smartphoneIcon} 
                    label="Share on WhatsApp" 
                    description="Send high-res voucher to guest"
                    color="bg-emerald-500" 
                    loading={isGenerating}
                    onClick={handleWhatsAppShare}
                  />
                  <ActionButton 
                    icon={Download} 
                    label="Download PNG" 
                    description="Save to your device storage"
                    color="bg-amber-500" 
                    onClick={handleDownload}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <ActionButton 
                      icon={Printer} 
                      label="Print" 
                      onClick={handlePrint}
                      secondary
                    />
                    <ActionButton 
                      icon={Mail} 
                      label="Email" 
                      onClick={handleEmailVoucher}
                      secondary
                    />
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4 ml-2">Quick Access Link</p>
                  <div className="flex gap-2">
                    <div className="flex-1 h-12 bg-white/5 border border-white/10 rounded-2xl px-4 flex items-center overflow-hidden">
                      <p className="text-[10px] text-white/40 truncate truncate">luxe-dining.com/res/{reservation.id.slice(0, 8)}</p>
                    </div>
                    <button 
                      onClick={handleCopyLink}
                      className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-90"
                    >
                      {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <button 
                  onClick={onClose}
                  className="w-full text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors py-4"
                >
                  Dismiss Panel
                </button>
              </div>

              <div className="p-8 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 flex gap-4">
                <Info size={20} className="text-amber-500 shrink-0" />
                <p className="text-[11px] text-amber-500/70 leading-relaxed">
                  Generates an Apple Wallet style high-fidelity PNG. Guests can scan the QR code at the reception for instant check-in.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

const smartphoneIcon = Smartphone;

const DetailRow = ({ icon: Icon, label, value }: any) => (
  <div className="space-y-1 flex flex-col items-center">
    <div className="flex items-center gap-1.5 opacity-30">
      <Icon size={10} className="text-amber-500" />
      <span className="text-[7px] font-black uppercase tracking-widest text-white">{label}</span>
    </div>
    <span className="text-xs font-black text-white uppercase tracking-tight">{value}</span>
  </div>
);

const ActionButton = ({ icon: Icon, label, description, color, onClick, secondary, loading }: any) => (
  <button 
    onClick={onClick}
    disabled={loading}
    className={`w-full group relative overflow-hidden flex items-center gap-5 p-5 rounded-3xl transition-all active:scale-[0.98] ${
      secondary 
        ? 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white' 
        : `${color} text-black font-black uppercase shadow-lg shadow-black/20`
    }`}
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
      secondary ? 'bg-white/5' : 'bg-black/10'
    }`}>
      {loading ? (
        <Loader2 className="animate-spin" size={24} />
      ) : (
        <Icon size={24} />
      )}
    </div>
    <div className="text-left">
      <p className="text-[11px] tracking-widest leading-none mb-1">{label}</p>
      {description && <p className="text-[10px] font-bold opacity-40 group-hover:opacity-60 transition-opacity leading-none">{description}</p>}
    </div>
  </button>
);

export default ReservationVoucher;

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Store, Upload, MapPin, Phone, Mail, Clock, Hash, Globe, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { db, storage } from '../../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '../../components/ui/button';

const OutletManagement = () => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [outlet, setOutlet] = useState<any>({
    name: 'Everest Fine Dine',
    logo: '',
    phone: '+91 98765 43210',
    email: 'info@everestdines.com',
    gstNumber: '27AAAAA0000A1Z5',
    address: '123 Luxury Avenue, Sector 5',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    openingHours: '11:00 AM - 11:00 PM'
  });

  useEffect(() => {
    const fetchOutlet = async () => {
      try {
        const docRef = doc(db, 'outlets', 'main-outlet');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setOutlet(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching outlet:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOutlet();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `outlets/logos/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setOutlet(prev => ({ ...prev, logo: downloadURL }));
      
      // Also update the document immediately if possible, or just leave it for handleSave
      // I'll leave it for handleSave to keep it consistent
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert("Failed to upload logo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await setDoc(doc(db, 'outlets', 'main-outlet'), {
        ...outlet,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving outlet:", error);
    } finally {
      setSaving(false);
    }
  };

  const inputClasses = "w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-500/50 transition-all outline-none text-white";
  const labelClasses = "text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-2 block";

  if (loading) return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex-1 p-6 lg:p-12 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="flex justify-between items-end">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white">Outlet Setup</h1>
            <p className="text-white/40 font-medium">Configure restaurant identity and locations</p>
          </div>
          <Button 
            disabled={saving}
            onClick={handleSave}
            className="h-12 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest px-8 rounded-xl shadow-[0_10px_30px_rgba(245,158,11,0.2)]"
          >
            {saving ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2" /> : success ? <CheckCircle2 size={18} className="mr-2" /> : <Save size={18} className="mr-2" />}
            {success ? 'Saved' : 'Save Changes'}
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Identity */}
          <section className="md:col-span-1 space-y-6">
            <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 text-center space-y-6 relative overflow-hidden group">
              <label className={labelClasses}>Outlet Branding</label>
              <div className="relative w-32 h-32 mx-auto">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="w-full h-full rounded-3xl bg-white/[0.05] border-2 border-dashed border-white/10 flex flex-col items-center justify-center transition-all group-hover:border-amber-500/40 overflow-hidden">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  ) : outlet.logo ? (
                    <img src={outlet.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <>
                      <Store size={32} className="text-white/20 mb-2" />
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Logo</span>
                    </>
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-black shadow-xl hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Upload size={18} />
                </button>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight text-white">{outlet.name}</h3>
                <p className="text-xs text-white/40">Primary Location</p>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity" />
            </div>
          </section>

          {/* Details Form */}
          <section className="md:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={labelClasses}>Restaurant Name</label>
                <div className="relative">
                  <Store size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input 
                    type="text" 
                    value={outlet.name}
                    onChange={(e) => setOutlet({...outlet, name: e.target.value})}
                    className={`${inputClasses} pl-11`} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelClasses}>GST Number</label>
                <div className="relative">
                  <Hash size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input 
                    type="text" 
                    value={outlet.gstNumber}
                    onChange={(e) => setOutlet({...outlet, gstNumber: e.target.value})}
                    className={`${inputClasses} pl-11`} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelClasses}>Primary Phone</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input 
                    type="text" 
                    value={outlet.phone}
                    onChange={(e) => setOutlet({...outlet, phone: e.target.value})}
                    className={`${inputClasses} pl-11`} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelClasses}>Business Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input 
                    type="email" 
                    value={outlet.email}
                    onChange={(e) => setOutlet({...outlet, email: e.target.value})}
                    className={`${inputClasses} pl-11`} 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelClasses}>Address Details</label>
              <div className="relative mb-3">
                <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                <input 
                  type="text" 
                  value={outlet.address}
                  onChange={(e) => setOutlet({...outlet, address: e.target.value})}
                  placeholder="Street Address" 
                  className={`${inputClasses} pl-11`} 
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input 
                  type="text" 
                  value={outlet.city}
                  onChange={(e) => setOutlet({...outlet, city: e.target.value})}
                  placeholder="City" 
                  className={inputClasses} 
                />
                <input 
                  type="text" 
                  value={outlet.state}
                  onChange={(e) => setOutlet({...outlet, state: e.target.value})}
                  placeholder="State" 
                  className={inputClasses} 
                />
                <input 
                  type="text" 
                  value={outlet.country}
                  onChange={(e) => setOutlet({...outlet, country: e.target.value})}
                  placeholder="Country" 
                  className={inputClasses} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelClasses}>Operational Hours</label>
              <div className="relative">
                <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                <input 
                  type="text" 
                  value={outlet.openingHours}
                  onChange={(e) => setOutlet({...outlet, openingHours: e.target.value})}
                  className={`${inputClasses} pl-11`} 
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default OutletManagement;

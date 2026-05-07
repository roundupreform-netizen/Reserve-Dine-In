import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Store, Upload, MapPin, Phone, Mail, Clock, Hash, Globe, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { db, storage } from '../../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';

const OutletManagement = () => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [outlet, setOutlet] = useState<any>({
    name: 'Everest Fine Dine',
    subtitle: 'Management Suite',
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

  const compressImage = (file: File): Promise<Blob | File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions for a logo
          const MAX_SIZE = 800;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          }, 'image/png', 0.8);
        };
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      let logoUrl = '';
      let processedFile: Blob | File = file;

      // Compress if it's an image
      if (file.type.startsWith('image/')) {
        processedFile = await compressImage(file);
      }
      
      try {
        if (!storage) throw new Error("Storage not initialized");
        
        const storageRef = ref(storage, `outlets/logos/${Date.now()}-${file.name}`);
        const snapshot = await uploadBytes(storageRef, processedFile);
        logoUrl = await getDownloadURL(snapshot.ref);
      } catch (storageError: any) {
        console.warn("Storage upload failed, falling back to Base64:", storageError);
        
        if (processedFile.size > 900000) { 
          throw new Error("File is too large for database storage. Please use a smaller file under 900KB.");
        }
        
        logoUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(processedFile);
        });
      }
      
      setOutlet(prev => ({ ...prev, logo: logoUrl }));
      
      await setDoc(doc(db, 'outlets', 'main-outlet'), {
        logo: logoUrl,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      alert(`Failed to upload logo: ${error.message || 'Unknown error'}`);
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
                  accept="image/*,application/pdf"
                  className="hidden"
                />
                <div 
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={cn(
                    "w-full h-full rounded-3xl bg-white/[0.05] border-2 border-dashed border-white/10 flex flex-col items-center justify-center transition-all overflow-hidden cursor-pointer",
                    !uploading && "hover:border-amber-500/40 hover:bg-white/[0.07]"
                  )}
                >
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  ) : outlet.logo ? (
                    outlet.logo.startsWith('data:application/pdf') || outlet.logo.includes('.pdf') ? (
                       <div className="flex flex-col items-center gap-2">
                         <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500">
                           <Save size={24} />
                         </div>
                         <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">PDF Logo</span>
                       </div>
                    ) : (
                      <img src={outlet.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                    )
                  ) : (
                    <>
                      <Store size={32} className="text-white/20 mb-2" />
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Upload Logo</span>
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
                <p className="text-xs text-white/40">{outlet.subtitle || 'Management Suite'}</p>
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
                <label className={labelClasses}>Management Title (Subtitle)</label>
                <div className="relative">
                  <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input 
                    type="text" 
                    value={outlet.subtitle || ''}
                    onChange={(e) => setOutlet({...outlet, subtitle: e.target.value})}
                    placeholder="e.target.value || 'Management Suite'"
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

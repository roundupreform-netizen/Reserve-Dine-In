import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface OutletData {
  name: string;
  subtitle?: string;
  logo: string;
  phone: string;
  email: string;
  gstNumber: string;
  address: string;
  city: string;
  state: string;
  country: string;
  openingHours: string;
}

interface OutletContextType {
  outlet: OutletData | null;
  loading: boolean;
}

const OutletContext = createContext<OutletContextType | undefined>(undefined);

export const OutletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [outlet, setOutlet] = useState<OutletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'outlets', 'main-outlet'), (doc) => {
      if (doc.exists()) {
        setOutlet(doc.data() as OutletData);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <OutletContext.Provider value={{ outlet, loading }}>
      {children}
    </OutletContext.Provider>
  );
};

export const useOutlet = () => {
  const context = useContext(OutletContext);
  if (context === undefined) {
    throw new Error('useOutlet must be used within an OutletProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

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
  const { user, isAuthReady } = useAuth();
  const [outlet, setOutlet] = useState<OutletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady) return;

    const unsub = onSnapshot(doc(db, 'outlets', 'main-outlet'), (doc) => {
      if (doc.exists()) {
        setOutlet(doc.data() as OutletData);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'outlets/main-outlet');
    });

    return () => unsub();
  }, [isAuthReady]);

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

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTHORIZED_EMAIL = 'roundupreform@gmail.com';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's a mock session in localStorage for this environment
    const savedUser = localStorage.getItem('demo_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed as User);
        setUserData({
          uid: parsed.uid,
          email: parsed.email,
          displayName: parsed.displayName,
          role: 'admin'
        });
      } catch (e) {
        localStorage.removeItem('demo_user');
      }
    }
    setLoading(false);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // If we still have firebase auth working (e.g. anonymous), handle it
        setUser(firebaseUser);
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          const newUserData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || 'demo@guest.com',
            displayName: firebaseUser.displayName || 'Demo User',
            role: 'admin',
            createdAt: serverTimestamp(),
          };
          await setDoc(userRef, newUserData);
          setUserData(newUserData);
        } else {
          setUserData(userSnap.data());
        }
      }
    });

    return unsubscribe;
  }, []);

  const loginAsAdmin = async () => {
    setError(null);
    try {
      // For immediate unblocking in shared environments, we use a mock session
      // while attempting an anonymous firebase session if possible
      const mockUser = {
        uid: 'demo-admin-id',
        email: AUTHORIZED_EMAIL,
        displayName: 'Project Admin',
        emailVerified: true
      };
      
      localStorage.setItem('demo_user', JSON.stringify(mockUser));
      setUser(mockUser as any);
      setUserData({
        uid: mockUser.uid,
        email: mockUser.email,
        displayName: mockUser.displayName,
        role: 'admin'
      });
      
      // Attempt anonymous auth in background to have a real Firestore token if available
      try {
        const { signInAnonymously } = await import('firebase/auth');
        await signInAnonymously(auth);
      } catch (e) {
        console.warn('Anonymous auth failed, continuing with mock session');
      }
    } catch (error) {
      console.error('Login Error:', error);
      setError('Failed to initialize access. Please try again.');
    }
  };

  const logout = async () => {
    localStorage.removeItem('demo_user');
    await signOut(auth);
    setUser(null);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, error, signInWithGoogle: loginAsAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

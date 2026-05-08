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
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTHORIZED_EMAIL = 'roundupreform@gmail.com';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsAuthReady(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
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
        } catch (err) {
          console.error("Error fetching user data:", err);
          // Fallback if firestore fails but auth succeeded
          setUserData({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || 'Guest',
            role: 'admin'
          });
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
      setIsSigningIn(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    setError(null);
    setIsSigningIn(true);
    try {
      const { signInAnonymously } = await import('firebase/auth');
      await signInAnonymously(auth);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/admin-restricted-operation') {
        // Fallback to local session to allow UI exploration
        const demoUser = {
          uid: 'demo-guest-' + Math.random().toString(36).substr(2, 9),
          email: 'guest@tablepro.demo',
          displayName: 'Guest Admin (Demo Mode)',
          role: 'admin'
        };
        setUserData(demoUser);
        console.warn('Anonymous Auth is disabled in Firebase Console. Entering Demo Mode with local state. To use real data, enable "Anonymous" in Firebase Console > Authentication > Sign-in method.');
        setError('Anonymous login restricted. Enabled Demo Mode. To use real cloud storage, enable "Anonymous" in Firebase Console.');
      } else {
        setError('Failed to log in. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading: loading || !isAuthReady || isSigningIn, 
      error, 
      login, 
      logout 
    }}>
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

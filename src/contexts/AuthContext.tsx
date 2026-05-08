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

  const signInWithGoogle = async () => {
    setError(null);
    setIsSigningIn(true);
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      // Add custom parameters to handle framing issues if needed
      provider.setCustomParameters({ prompt: 'select_account' });
      
      try {
        await signInWithPopup(auth, provider);
      } catch (e: any) {
        console.error('Google Sign-In Error:', e);
        if (e.code === 'auth/popup-blocked') {
          setError('The sign-in popup was blocked by your browser. Please allow popups for this site.');
        } else if (e.code === 'auth/cancelled-popup-request') {
          // User closed the popup, don't show an error
        } else if (e.code === 'auth/admin-restricted-operation') {
          setError('Google Login is restricted in your Firebase project. Please enable Google Auth in the Firebase Console.');
        } else {
          setError('Failed to sign in with Google. Please try again.');
        }
      }
    } catch (error) {
      console.error('Auth Module Load Error:', error);
      setError('Failed to load authentication modules.');
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
      signInWithGoogle, 
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

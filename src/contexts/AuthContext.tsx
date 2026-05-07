import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setError(null);
      if (user) {
        if (user.email !== AUTHORIZED_EMAIL) {
          setError('Unauthorized access: This app is restricted to authorized developers only.');
          await signOut(auth);
          setUser(null);
          setUserData(null);
          setLoading(false);
          return;
        }

        setUser(user);
        // Fetch or create user record in Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          const newUserData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: 'admin', // Since it's restricted to ADMIN_EMAIL, all logins are admin
            createdAt: serverTimestamp(),
          };
          await setDoc(userRef, newUserData);
          setUserData(newUserData);
        } else {
          setUserData(userSnap.data());
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setError(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login Error:', error);
      setError('Failed to sign in. Please try again.');
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, userData, loading, error, signInWithGoogle, logout }}>
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

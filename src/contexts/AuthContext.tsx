import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, signInWithGoogle, logoutUser, UserProfile, db } from '../services/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<UserProfile>;
  logout: () => Promise<void>;
  loginAsGuest: (customEmail?: string) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('imasbtc_user_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const profile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Trader',
            photoURL: firebaseUser.photoURL,
            lastLoginAt: new Date().toISOString(),
            isAnonymous: firebaseUser.isAnonymous,
          };
          setUser(profile);
          localStorage.setItem('imasbtc_user_session', JSON.stringify(profile));

          // Background update profile to Firestore
          if (db) {
            try {
              const uRef = doc(db, 'users', firebaseUser.uid);
              await setDoc(uRef, {
                ...profile,
                updatedAt: serverTimestamp(),
              }, { merge: true });
            } catch (e) {
              // ignore transient offline
            }
          }
        } else {
          // If not in Firebase auth, check if user was manually logged in demo session
          const saved = localStorage.getItem('imasbtc_user_session');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed.isAnonymous) {
                setUser(parsed);
              } else {
                setUser(null);
              }
            } catch {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (authErr) {
      console.warn('Auth state listener init warning:', authErr);
      setLoading(false);
    }
  }, []);

  const handleGoogleLogin = async (): Promise<UserProfile> => {
    setLoading(true);
    try {
      const profile = await signInWithGoogle();
      setUser(profile);
      localStorage.setItem('imasbtc_user_session', JSON.stringify(profile));
      return profile;
    } catch (err: any) {
      console.error('Login failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
    } catch (e) {
      console.warn('Firebase signout notice:', e);
    }
    localStorage.removeItem('imasbtc_user_session');
    setUser(null);
    setLoading(false);
  };

  const loginAsGuest = (customEmail?: string) => {
    const guestUser: UserProfile = {
      uid: 'demo_' + Math.random().toString(36).substring(2, 9),
      email: customEmail || 'trader.demo@gmail.com',
      displayName: customEmail ? customEmail.split('@')[0] : 'Pro Demo Trader',
      photoURL: null,
      lastLoginAt: new Date().toISOString(),
      isAnonymous: true,
    };
    setUser(guestUser);
    localStorage.setItem('imasbtc_user_session', JSON.stringify(guestUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle: handleGoogleLogin,
        logout: handleLogout,
        loginAsGuest,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.ts';
import {
  auth,
  googleProvider,
  isFirebaseConfigured,
} from '../firebase/firebase.ts';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';

const AUTHORIZED_ADMIN_EMAILS = [
  'khanjayed600@gmail.com',
  'admin@myagrofarm.com',
  'ceo@myagrofarm.com',
];

export function isEmailAuthorizedAdmin(email?: string | null): boolean {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  const envAdmin = import.meta.env.VITE_FIREBASE_ADMIN_EMAIL?.toLowerCase().trim();
  if (envAdmin && cleanEmail === envAdmin) return true;
  return AUTHORIZED_ADMIN_EMAILS.includes(cleanEmail);
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  adminUser: User | null;
  adminToken: string | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  loginCustomer: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerCustomer: (data: any) => Promise<{ success: boolean; error?: string }>;
  loginAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAdminWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  logoutAdmin: () => void;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('myagro_user_token'));
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('myagro_admin_token'));
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Firebase Auth state
  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser && fbUser.email && isEmailAuthorizedAdmin(fbUser.email)) {
        // Automatically authorize admin in UI
        const adminProfile: User = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Authorized Admin',
          email: fbUser.email,
          phone: fbUser.phoneNumber || '01712000000',
          role: 'superadmin',
          addresses: [],
          createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
        };
        setAdminUser(adminProfile);
        setAdminToken(`fb-${fbUser.uid}`);
        localStorage.setItem('myagro_admin_token', `fb-${fbUser.uid}`);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load customer profile if token exists
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setToken(null);
          localStorage.removeItem('myagro_user_token');
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [token]);

  // Load admin profile if adminToken exists
  useEffect(() => {
    async function loadAdmin() {
      if (!adminToken) {
        setAdminUser(null);
        return;
      }

      // Check if it's a firebase auth session token
      if (adminToken.startsWith('fb-')) {
        if (!adminUser && firebaseUser && isEmailAuthorizedAdmin(firebaseUser.email)) {
          setAdminUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Firebase Admin',
            email: firebaseUser.email || 'admin@myagrofarm.com',
            phone: '01712000001',
            role: 'superadmin',
            addresses: [],
            createdAt: new Date().toISOString(),
          });
        }
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user.role === 'admin' || data.user.role === 'superadmin') {
            setAdminUser(data.user);
          } else {
            setAdminToken(null);
            localStorage.removeItem('myagro_admin_token');
          }
        } else {
          setAdminToken(null);
          localStorage.removeItem('myagro_admin_token');
          setAdminUser(null);
        }
      } catch (err) {
        console.error('Failed to load admin profile:', err);
      }
    }
    loadAdmin();
  }, [adminToken, firebaseUser]);

  const loginCustomer = async (identifier: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'লগইন ব্যর্থ হয়েছে।' };
      }
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('myagro_user_token', data.token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'সার্ভার সংযোগ সমস্যা।' };
    }
  };

  const registerCustomer = async (formData: any) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'নিবন্ধন ব্যর্থ হয়েছে।' };
      }
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('myagro_user_token', data.token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'সার্ভার সংযোগ সমস্যা।' };
    }
  };

  const loginAdmin = async (email: string, password: string) => {
    // 1. Try Firebase Auth first if configured
    if (isFirebaseConfigured() && auth) {
      try {
        const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (userCred.user && isEmailAuthorizedAdmin(userCred.user.email)) {
          const adminProf: User = {
            id: userCred.user.uid,
            name: userCred.user.displayName || 'Authorized Admin',
            email: userCred.user.email || email,
            phone: '01712000001',
            role: 'superadmin',
            addresses: [],
            createdAt: new Date().toISOString(),
          };
          setAdminUser(adminProf);
          setAdminToken(`fb-${userCred.user.uid}`);
          localStorage.setItem('myagro_admin_token', `fb-${userCred.user.uid}`);
          return { success: true };
        } else if (userCred.user) {
          await signOut(auth);
          return { success: false, error: 'অননুমোদিত অ্যাডমিন অ্যাকাউন্ট। এই ইমেইল অ্যাডমিন তালিকায় অন্তর্ভুক্ত নয়।' };
        }
      } catch (fbErr: any) {
        console.warn('Firebase email auth skipped or failed, testing API auth:', fbErr.message);
      }
    }

    // 2. Fallback to API admin login
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'অ্যাডমিন লগইন ব্যর্থ হয়েছে।' };
      }
      setAdminToken(data.token);
      setAdminUser(data.user);
      localStorage.setItem('myagro_admin_token', data.token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'সার্ভার সংযোগ সমস্যা।' };
    }
  };

  const loginAdminWithGoogle = async () => {
    if (!isFirebaseConfigured() || !auth || !googleProvider) {
      return {
        success: false,
        error: 'Firebase এখনো কনফিগার করা হয়নি। অনুগ্রহ করে আগে ফায়ারবেস সংযোগ সম্পন্ন করুন।',
      };
    }

    try {
      const res = await signInWithPopup(auth, googleProvider);
      const email = res.user.email;
      if (!isEmailAuthorizedAdmin(email)) {
        await signOut(auth);
        return {
          success: false,
          error: `প্রবেশাধিকার প্রত্যাখ্যাত: (${email}) অনুমোদিত অ্যাডমিন ইমেইল নয়।`,
        };
      }

      const adminProf: User = {
        id: res.user.uid,
        name: res.user.displayName || 'Google Verified Admin',
        email: email || '',
        phone: res.user.phoneNumber || '01712000001',
        role: 'superadmin',
        addresses: [],
        createdAt: new Date().toISOString(),
      };

      setAdminUser(adminProf);
      setAdminToken(`fb-${res.user.uid}`);
      localStorage.setItem('myagro_admin_token', `fb-${res.user.uid}`);
      return { success: true };
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      return { success: false, error: err.message || 'গুগল লগইন ব্যর্থ হয়েছে।' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('myagro_user_token');
  };

  const logoutAdmin = async () => {
    if (auth && auth.currentUser) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn(e);
      }
    }
    setAdminToken(null);
    setAdminUser(null);
    localStorage.removeItem('myagro_admin_token');
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!token) return { success: false, error: 'অননুমোদিত' };
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'আপডেট ব্যর্থ হয়েছে।' };
      }
      setUser(resData.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        adminUser,
        adminToken,
        firebaseUser,
        isLoading,
        loginCustomer,
        registerCustomer,
        loginAdmin,
        loginAdminWithGoogle,
        logout,
        logoutAdmin,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

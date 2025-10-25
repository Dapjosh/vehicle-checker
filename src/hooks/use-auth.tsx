"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserData, ensureSuperOrgExists } from '@/lib/firestore';
import type { UserData, UserRole } from '@/lib/definitions';
import { SUPER_ADMIN_UID } from '@/lib/config';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: UserData | null;
  firebaseUser: FirebaseUser | null;
  role: UserRole | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const superAdminUser: UserData = {
  uid: SUPER_ADMIN_UID || 'super_admin_uid',
  email: 'super@admin.com',
  role: 'super_admin',
  orgId: 'SUPER_ORG',
  displayName: 'Super Admin',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        let userData: UserData | null = null;
        
        if (SUPER_ADMIN_UID && fbUser.uid === SUPER_ADMIN_UID) {
          userData = superAdminUser;
          await ensureSuperOrgExists(fbUser.uid);
        } else {
          userData = await getUserData(fbUser.uid);
        }

        if (userData) {
          setUser(userData);
          setRole(userData.role);
        } else {
           if (pathname !== '/signup') {
             await signOut(auth);
           }
           setUser(null);
           setRole(null);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname]);

  useEffect(() => {
    if (loading) return;

    const publicPages = ['/login', '/signup', '/forgot-password', '/reset-password'];
    const isAuthPage = publicPages.some(page => pathname.startsWith(page));

    if (user && isAuthPage) {
      router.replace('/');
      return;
    }

    if (!user && !isAuthPage) {
      router.replace('/login');
      return;
    }
    
    if(user && !isAuthPage) {
        if (user.role === 'super_admin' && pathname === '/admin') {
           router.replace('/super-admin');
        }
        if (user.role === 'member' && pathname === '/super-admin') {
           router.replace('/');
        }
        if (user.role !== 'super_admin' && pathname === '/super-admin') {
           router.replace('/');
        }
    }

  }, [user, loading, pathname, router]);


  const logout = async () => {
    await signOut(auth);
  };
  
  if (loading) {
     return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, role, loading, logout }}>
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

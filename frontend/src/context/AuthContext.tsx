
import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';

import type { ReactNode } from 'react';

import { auth, db } from '../data/firebase';

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';

import type { User } from 'firebase/auth';

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';

// ==========================================
// USER TYPE
// ==========================================

export interface AuthUser {
  uid: string;
  name: string;
  displayName: string;
  email: string;
  role: string;
}

// ==========================================
// AUTH CONTEXT TYPE
// ==========================================

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: User | null;
  loading: boolean;
  isAdmin: boolean;

  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  logout: () => Promise<void>;

  refreshUser: () => Promise<void>;
}

// ==========================================
// CREATE CONTEXT
// ==========================================

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// ==========================================
// AUTH PROVIDER
// ==========================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children
}) => {

  const [user, setUser] = useState<AuthUser | null>(null);

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  // ========================================
  // FETCH USER FROM FIRESTORE
  // ========================================

  const fetchUserData = async (currentUser: User) => {

    const userRef = doc(db, 'users', currentUser.uid);

    const userSnap = await getDoc(userRef);

    let userData: Record<string, any>;

    if (userSnap.exists()) {

      userData = userSnap.data();

    } else {

      // Create document using actual Firebase UID

      userData = {
        uid: currentUser.uid,
        name: currentUser.displayName || '',
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
        role: 'customer',
        createdAt: serverTimestamp()
      };

      await setDoc(userRef, userData);
    }

    const authUser: AuthUser = {
      uid: currentUser.uid,
      name: userData.name || currentUser.displayName || '',
      displayName:
        userData.displayName ||
        userData.name ||
        currentUser.displayName ||
        '',
      email: userData.email || currentUser.email || '',
      role: userData.role || 'customer'
    };

    setUser(authUser);
    setFirebaseUser(currentUser);

    return authUser;
  };

  // ========================================
  // REGISTER
  // ========================================

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<void> => {

    try {

      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(result.user, {
        displayName: name
      });

      const newUser = {
        uid: result.user.uid,
        name,
        displayName: name,
        email: result.user.email || email,
        role: 'customer',
        createdAt: serverTimestamp()
      };

      const userRef = doc(db, 'users', result.user.uid);

      await setDoc(userRef, newUser, { merge: true });

      setFirebaseUser(result.user);

      setUser({
        uid: result.user.uid,
        name,
        displayName: name,
        email: result.user.email || email,
        role: 'customer'
      });

      console.log('Registration successful:', result.user.uid);

    } catch (error) {

      console.error('Registration error:', error);

      throw error;
    }
  };

  // ========================================
  // LOGIN
  // ========================================

  const login = async (
    email: string,
    password: string
  ): Promise<void> => {

    try {

      const result = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      await fetchUserData(result.user);

      console.log('Login successful:', result.user.uid);

    } catch (error) {

      console.error('Login error:', error);

      throw error;
    }
  };

  // ========================================
  // LOGOUT
  // ========================================

  const logout = async (): Promise<void> => {

    try {

      await signOut(auth);

      setUser(null);
      setFirebaseUser(null);

      console.log('Logout successful');

    } catch (error) {

      console.error('Logout error:', error);

      throw error;
    }
  };

  // ========================================
  // REFRESH USER
  // ========================================

  const refreshUser = async (): Promise<void> => {

    const currentUser = auth.currentUser;

    if (currentUser) {
      await fetchUserData(currentUser);
    }
  };

  // ========================================
  // AUTH STATE LISTENER
  // ========================================

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {

        try {

          if (currentUser) {

            await fetchUserData(currentUser);

          } else {

            setFirebaseUser(null);
            setUser(null);

          }

        } catch (error) {

          console.error('Auth state error:', error);

          setFirebaseUser(null);
          setUser(null);

        } finally {

          setLoading(false);

        }
      }
    );

    return () => unsubscribe();

  }, []);

  // ========================================
  // ADMIN CHECK
  // ========================================

  const isAdmin = user?.role === 'admin';

  // ========================================
  // CONTEXT VALUE
  // ========================================

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    isAdmin,
    register,
    login,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ==========================================
// CUSTOM HOOK
// ==========================================

export const useAuth = (): AuthContextType => {

  const context = useContext(AuthContext);

  if (!context) {

    throw new Error(
      'useAuth must be used inside AuthProvider'
    );

  }

  return context;
};

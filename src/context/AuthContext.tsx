
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  socialLogin: (provider: 'google') => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Create user document in Firestore
  const createUserDocument = async (user: User) => {
    if (!user || !db) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userRef);

      if (!snapshot.exists()) {
        const { email, displayName, photoURL } = user;
        
        await setDoc(userRef, {
          email,
          displayName: displayName || email?.split('@')[0],
          photoURL,
          createdAt: serverTimestamp(),
          verificationHistory: []
        });
      }
    } catch (error) {
      console.error('Error creating user document:', error);
      // Don't throw - user auth can still work without the document
    }
  };

  // Sign up with email and password
  const signup = async (email: string, password: string): Promise<User> => {
    if (!auth) throw new Error('Authentication not available');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await createUserDocument(result.user);
    return result.user;
  };

  // Login with email and password
  const login = async (email: string, password: string): Promise<User> => {
    if (!auth) throw new Error('Authentication not available');
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  // Logout
  const logout = (): Promise<void> => {
    if (!auth) throw new Error('Authentication not available');
    return signOut(auth);
  };

  // Social login (Google only)
  const socialLogin = async (providerName: 'google'): Promise<User> => {
    if (!auth) throw new Error('Authentication not available');
    
    if (providerName !== 'google') {
      throw new Error(`Unsupported provider: ${providerName}`);
    }
    
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    try {
      const result = await signInWithPopup(auth, provider);
      await createUserDocument(result.user);
      return result.user;
    } catch (error: any) {
      // Add more specific error handling
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup blocked. Please allow popups and try again.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Login cancelled by user.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    if (!auth) throw new Error('Authentication not available');
    await sendPasswordResetEmail(auth, email);
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);
  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    socialLogin,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

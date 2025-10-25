// context/AuthContext.js
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.data();
        
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          ...userData
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign up with email validation
  const signUp = async (email, password, displayName) => {
    // Check if email is from KLH domain
    if (!email.endsWith('@klh.edu.in')) {
      throw new Error('Only @klh.edu.in email addresses are allowed');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Send verification email (Firebase handles this automatically)
    await sendEmailVerification(user);

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      displayName,
      email,
      role: 'student',
      joinedAt: new Date().toISOString(),
      photoURL: null
    });

    return user;
  };

  // Sign in
  const signIn = async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
  };

  // Sign out
  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  // Forgot password (Firebase handles OTP via email)
  const resetPassword = async (email) => {
    if (!email.endsWith('@klh.edu.in')) {
      throw new Error('Only @klh.edu.in email addresses are allowed');
    }
    await sendPasswordResetEmail(auth, email);
  };

  // Resend verification email
  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    resendVerification
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth
export function useAuth() {
  return useContext(AuthContext);
}

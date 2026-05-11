'use client';

import { useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { useAuth } from '../provider';
import { errorEmitter } from '../error-emitter';

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
  }, [auth]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      // Errors are handled through the central listener or contextual toasts
      // depending on the nature of the error (auth vs firestore)
      if (error.code === 'auth/api-key-not-valid') {
        console.error('Invalid Firebase API Key. Please update src/firebase/config.ts with your actual key.');
      }
    }
  };

  const logout = () => signOut(auth);

  return { user, loading, signInWithGoogle, logout };
}

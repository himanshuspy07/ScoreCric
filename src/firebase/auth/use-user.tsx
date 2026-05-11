'use client';

import { useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { useAuth } from '../provider';
import { useToast } from '@/hooks/use-toast';

export function useUser() {
  const auth = useAuth();
  const { toast } = useToast();
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
    // Prompt for account selection to ensure a fresh request
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Authentication Error:', error);
      
      let errorMessage = 'An unexpected error occurred during sign-in.';
      
      if (error.code === 'auth/api-key-not-valid') {
        errorMessage = 'Invalid Firebase API Key. Please check your configuration.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google Sign-In is not enabled in your Firebase Console.';
      } else if (error.code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
        errorMessage = `The domain "${domain}" is not authorized. Please add it to "Authorized domains" in your Firebase Console (Authentication > Settings).`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "Sign-In Failed",
        description: errorMessage,
      });
    }
  };

  const logout = () => {
    signOut(auth).catch((error) => {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message,
      });
    });
  };

  return { user, loading, signInWithGoogle, logout };
}

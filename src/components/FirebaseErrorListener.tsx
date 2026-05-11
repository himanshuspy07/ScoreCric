'use client';

import React, { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * A central listener component for Firebase errors.
 * It intercepts errors emitted through the global errorEmitter and surfaces them to the UI.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // Surface contextual security rules errors
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: `You don't have permission to ${error.context.operation} at ${error.context.path}. Please check your Security Rules.`,
      });
      
      // We throw the error so it can be caught by Next.js development overlay
      // during local development.
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}

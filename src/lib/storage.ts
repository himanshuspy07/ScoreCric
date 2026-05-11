
'use client';

import { Match } from '@/types/cricket';
import { doc, setDoc, deleteDoc, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Saves match data to Firestore.
 * This operation is optimistic and non-blocking.
 */
export const saveMatchToFirestore = (db: Firestore, match: Match) => {
  const matchRef = doc(db, 'matches', match.id);
  const data = { ...match, updatedAt: Date.now() };

  // Note: We do NOT await here. Firestore handles background sync and optimistic UI.
  setDoc(matchRef, data, { merge: true })
    .catch(async (error) => {
      const permissionError = new FirestorePermissionError({
        path: matchRef.path,
        operation: 'write',
        requestResourceData: data,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
};

/**
 * Deletes a match from Firestore.
 */
export const deleteMatchFromFirestore = (db: Firestore, id: string) => {
  const matchRef = doc(db, 'matches', id);
  
  // Non-blocking delete
  deleteDoc(matchRef)
    .catch(async (error) => {
      const permissionError = new FirestorePermissionError({
        path: matchRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    });
};

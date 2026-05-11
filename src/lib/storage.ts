
'use client';

import { Match } from '@/types/cricket';
import { doc, setDoc, deleteDoc, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const saveMatchToFirestore = (db: Firestore, match: Match) => {
  const matchRef = doc(db, 'matches', match.id);
  const data = { ...match, updatedAt: Date.now() };

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

export const deleteMatchFromFirestore = (db: Firestore, id: string) => {
  const matchRef = doc(db, 'matches', id);
  deleteDoc(matchRef)
    .catch(async (error) => {
      const permissionError = new FirestorePermissionError({
        path: matchRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    });
};

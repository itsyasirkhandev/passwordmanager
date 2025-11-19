
"use client";

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import * as CryptoJS from 'crypto-js';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Zod schema for token validation
const tokenSchema = z.object({
  name: z.string().min(1, "Token name is required."),
  value: z.string().min(1, "Token value is required."),
});

export type TokenFormValues = z.infer<typeof tokenSchema>;
export type TokenEntry = {
  id: string;
  name: string;
  value: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId?: string;
};

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
    console.error("CRITICAL: NEXT_PUBLIC_ENCRYPTION_KEY is not set. Token data will not be secure.");
}

const encryptToken = (value: string): string => {
    if (!ENCRYPTION_KEY) return value;
    return CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString();
};

const decryptToken = (encryptedValue: string): string => {
    if (!ENCRYPTION_KEY) return encryptedValue;
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedValue, ENCRYPTION_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText || encryptedValue;
    } catch (e) {
        return encryptedValue;
    }
};

type TokenContextType = {
  tokens: TokenEntry[];
  isLoadingTokens: boolean;
  addOrUpdateToken: (data: Partial<TokenFormValues>, id?: string) => Promise<void>;
  deleteToken: (id: string) => Promise<void>;
  getDecryptedToken: (entry: TokenEntry) => string;
};

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const tokensCol = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'users', user.uid, 'tokens');
  }, [firestore, user]);

  const { data: tokens, isLoading: isLoadingTokens } = useCollection<TokenEntry>(tokensCol);

  const addOrUpdateToken = async (data: Partial<TokenFormValues>, id?: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    const collectionPath = `users/${user.uid}/tokens`;
    const docRef = id ? doc(firestore, collectionPath, id) : doc(collection(firestore, collectionPath));

    const isEditing = !!id;

    const dataToSave: any = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    if (data.value) {
      dataToSave.value = encryptToken(data.value);
    }

    if (!isEditing) {
        dataToSave.createdAt = serverTimestamp();
        dataToSave.userId = user.uid;
    }


    try {
      await setDoc(docRef, dataToSave, { merge: true });
      toast({ title: 'Success', description: id ? 'Token updated.' : 'Token added.' });
    } catch (serverError) {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: id ? 'update' : 'create',
        requestResourceData: dataToSave,
      });
      errorEmitter.emit('permission-error', permissionError);
    }
  };

  const deleteToken = async (id: string) => {
    if (!user) return;
    const docRef = doc(firestore, 'users', user.uid, 'tokens', id);
    try {
      await deleteDoc(docRef);
      toast({ title: 'Success', description: 'Token deleted.' });
    } catch (serverError) {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    }
  };

  const getDecryptedToken = (entry: TokenEntry): string => {
    return decryptToken(entry.value);
  };

  const value = {
    tokens: tokens || [],
    isLoadingTokens,
    addOrUpdateToken,
    deleteToken,
    getDecryptedToken,
  };

  return <TokenContext.Provider value={value}>{children}</TokenContext.Provider>;
}

export function useTokens() {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error('useTokens must be used within a TokenProvider');
  }
  return context;
}

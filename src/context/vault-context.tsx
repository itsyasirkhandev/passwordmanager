
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import * as CryptoJS from 'crypto-js';
import { type PasswordEntry, type PasswordFormValues } from '@/app/vault/password-form-dialog';
import type { Folder } from '@/components/folder-sidebar';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
    console.error("CRITICAL: NEXT_PUBLIC_ENCRYPTION_KEY is not set. Vault data will not be secure.");
}


const encryptPassword = (password: string): string => {
    if (!ENCRYPTION_KEY) return password; // Fallback for missing key
    return CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
};

const decryptPassword = (encryptedPassword: string): string => {
    if (!ENCRYPTION_KEY) return encryptedPassword; // Fallback for missing key
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        
        // If decryption results in an empty string, it means the password was not
        // properly encrypted or is plaintext. Return the original value.
        if (!originalText) {
            return encryptedPassword;
        }

        return originalText;
    } catch (e) {
        // This catch block handles errors like "Malformed UTF-8 data" which occur
        // when trying to decrypt a string that was never encrypted.
        return encryptedPassword; // Return as-is on any error
    }
};


type VaultContextType = {
  passwords: PasswordEntry[];
  isLoadingPasswords: boolean;
  folders: Folder[];
  addFolder: (folderName: string) => void;
  allTags: string[];
  selectedFolderId: string | null;
  selectFolder: (id: string | null) => void;
  selectedTag: string | null;
  selectTag: (tag: string | null) => void;
  addOrUpdatePassword: (data: PasswordFormValues, id?: string) => Promise<void>;
  deletePassword: (id: string, permanent?: boolean) => Promise<void>;
  restorePassword: (id: string) => Promise<void>;
  toggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  getDecryptedPassword: (entry: PasswordEntry) => string;
};

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [isLoadingPasswords, setIsLoadingPasswords] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  // Fetch vaults (folders) from Firestore
  const vaultsCol = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'users', user.uid, 'vaults');
  }, [firestore, user]);
  
  const { data: folders, isLoading: isLoadingFolders } = useCollection<Folder>(vaultsCol);

  // Function to create a default vault
  const createDefaultVault = useCallback(async () => {
    if (!user || !firestore) return;
    const defaultVaultRef = doc(collection(firestore, 'users', user.uid, 'vaults'));
    const newFolder = { name: "Personal", userId: user.uid, id: defaultVaultRef.id };
    try {
        await setDoc(defaultVaultRef, newFolder);
        toast({
            title: "Welcome!",
            description: "We've created a 'Personal' vault for you to get started."
        });
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: defaultVaultRef.path,
            operation: 'create',
            requestResourceData: newFolder,
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }, [user, firestore, toast]);

  // Effect to create a default vault if none exist for the user
  useEffect(() => {
    if (user && !isLoadingFolders && folders && folders.length === 0) {
      createDefaultVault();
    }
  }, [user, isLoadingFolders, folders, createDefaultVault]);


  useEffect(() => {
    if (!user || !firestore) {
      setIsLoadingPasswords(!user);
      setPasswords([]);
      return;
    }
    
    if (isLoadingFolders || !folders) {
        setIsLoadingPasswords(true);
        return;
    }

    if (folders.length === 0) {
        setPasswords([]);
        setIsLoadingPasswords(false);
        return;
    }

    setIsLoadingPasswords(true);
    
    const credentialQueries = folders.map(folder => 
        getDocs(collection(firestore, 'users', user.uid, 'vaults', folder.id, 'credentials'))
    );

    Promise.all(credentialQueries)
      .then(querySnapshots => {
        const allPasswords = querySnapshots.flatMap(snapshot =>
          snapshot.docs.map(doc => ({ ...doc.data() as Omit<PasswordEntry, 'id'>, id: doc.id } as PasswordEntry))
        );
        setPasswords(allPasswords);
      })
      .catch(error => {
        console.error("Error fetching credentials from vaults:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load credentials.' });
      })
      .finally(() => {
        setIsLoadingPasswords(false);
      });

  }, [user, firestore, folders, isLoadingFolders, toast]);


  const addFolder = (folderName: string) => {
     if (!user) return;
     const newFolderRef = doc(collection(firestore, 'users', user.uid, 'vaults'));
     const newFolder: Partial<Folder> & {userId: string, id: string} = { name: folderName, userId: user.uid, id: newFolderRef.id };
     setDoc(newFolderRef, newFolder).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: newFolderRef.path,
            operation: 'create',
            requestResourceData: newFolder,
        });
        errorEmitter.emit('permission-error', permissionError);
     });
  };
  
  const selectFolder = (folderId: string | null) => {
    if (pathname !== '/vault') {
      router.push('/vault');
    }
    setSelectedFolderId(folderId);
    setSelectedTag(null);
  };

  const selectTag = (tag: string | null) => {
    if (pathname !== '/vault') {
      router.push('/vault');
    }
    setSelectedTag(tag);
    setSelectedFolderId(null);
  };

  const addOrUpdatePassword = async (data: PasswordFormValues, id?: string) => {
    if (!user || !data.folderId) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and select a vault.' });
      return;
    }
    const collectionPath = `users/${user.uid}/vaults/${data.folderId}/credentials`;
    const docRef = id ? doc(firestore, collectionPath, id) : doc(collection(firestore, collectionPath));
    
    const now = Timestamp.now();
    const originalPasswords = passwords;

    // Optimistic update
    if (id) {
        // Update existing password
        setPasswords(prev => prev.map(p => p.id === id ? { ...p, ...data, updatedAt: now } : p));
    } else {
        // Add new password
        const newPassword: PasswordEntry = {
            ...data,
            id: docRef.id,
            createdAt: now,
            updatedAt: now,
            userId: user.uid,
        };
        setPasswords(prev => [...prev, newPassword]);
    }
    
    const dataToSave = {
      ...data,
      password: encryptPassword(data.password), // Encrypt for Firestore
      updatedAt: serverTimestamp(),
      ...(id ? {} : { createdAt: serverTimestamp(), userId: user.uid }),
    };

    setDoc(docRef, dataToSave, { merge: true })
      .then(() => {
          toast({ title: 'Success', description: id ? 'Password updated.' : 'Password added.' });
      })
      .catch(serverError => {
          // Revert optimistic update on error
          setPasswords(originalPasswords); 
          const permissionError = new FirestorePermissionError({
              path: docRef.path,
              operation: id ? 'update' : 'create',
              requestResourceData: dataToSave,
          });
          errorEmitter.emit('permission-error', permissionError);
      });
  };

  const deletePassword = async (id: string, permanent = false) => {
    if (!user) return;
    const passwordToDelete = passwords.find(p => p.id === id);
    if (!passwordToDelete || !passwordToDelete.folderId) return;
    
    const originalPasswords = passwords;

    const docRef = doc(firestore, 'users', user.uid, 'vaults', passwordToDelete.folderId, 'credentials', id);

    if (permanent) {
      // Optimistic delete
      setPasswords(prev => prev.filter(p => p.id !== id));
      deleteDoc(docRef)
        .then(() => {
            toast({ title: 'Success', description: 'Password permanently deleted.' });
        })
        .catch(serverError => {
            setPasswords(originalPasswords); // Revert on error
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    } else {
      const now = Timestamp.now();
      const updatedEntry = { ...passwordToDelete, deletedAt: now, updatedAt: now };

      // Optimistic update (for moving to trash)
      setPasswords(prev => prev.map(p => p.id === id ? updatedEntry : p));


      const updateData = { deletedAt: serverTimestamp(), updatedAt: serverTimestamp() };
      updateDoc(docRef, updateData)
        .then(() => {
            toast({ title: 'Success', description: 'Password moved to trash.' });
        })
        .catch(serverError => {
            setPasswords(originalPasswords); // Revert on error
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: updateData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    }
  };

  const restorePassword = async (id: string) => {
    if (!user) return;
    const passwordToRestore = passwords.find(p => p.id === id);
    if (!passwordToRestore || !passwordToRestore.folderId) return;
    
    const originalPasswords = passwords;
    const now = Timestamp.now();
    const updatedEntry = { ...passwordToRestore, deletedAt: null, updatedAt: now };

    // Optimistic update
    setPasswords(prev => prev.map(p => p.id === id ? updatedEntry : p));

    const docRef = doc(firestore, 'users', user.uid, 'vaults', passwordToRestore.folderId, 'credentials', id);
    const updateData = { deletedAt: null, updatedAt: serverTimestamp() };
    
    updateDoc(docRef, updateData)
        .then(() => {
            toast({ title: 'Success', description: 'Password restored.' });
        })
        .catch(serverError => {
            setPasswords(originalPasswords); // Revert on error
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: updateData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    if (!user) return;
    const passwordToToggle = passwords.find(p => p.id === id);
    if (!passwordToToggle || !passwordToToggle.folderId) return;

    const originalPasswords = [...passwords];
    const updatedEntry = { ...passwordToToggle, isFavorite: !isFavorite, updatedAt: Timestamp.now() };

    // Optimistic update
    setPasswords(prev => prev.map(p => p.id === id ? updatedEntry : p));

    const docRef = doc(firestore, 'users', user.uid, 'vaults', passwordToToggle.folderId, 'credentials', id);
    const updateData = { isFavorite: !isFavorite, updatedAt: serverTimestamp() };

    updateDoc(docRef, updateData)
        .catch(serverError => {
            setPasswords(originalPasswords); // Revert on error
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: updateData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };
  
  const getDecryptedPassword = (entry: PasswordEntry): string => {
    return decryptPassword(entry.password);
  }

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    passwords?.forEach(p => {
        if(!p.deletedAt) {
            p.tags?.forEach(tag => tags.add(tag));
        }
    });
    return Array.from(tags).sort();
  }, [passwords]);

  const value = {
    passwords: passwords || [],
    isLoadingPasswords,
    folders: folders || [],
    addFolder,
    allTags,
    selectedFolderId,
    selectFolder,
    selectedTag,
    selectTag,
    addOrUpdatePassword,
    deletePassword,
    restorePassword,
    toggleFavorite,
    getDecryptedPassword,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}

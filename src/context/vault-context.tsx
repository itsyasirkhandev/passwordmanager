
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { type PasswordEntry, type PasswordFormValues } from '@/app/vault/password-form-dialog';
import type { Folder } from '@/components/folder-sidebar';
import { useToast } from '@/hooks/use-toast';

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
  const { data: folders = [], isLoading: isLoadingFolders } = useCollection<Folder>(vaultsCol);

  useEffect(() => {
    if (!user || !firestore || isLoadingFolders) {
      setIsLoadingPasswords(!user || isLoadingFolders);
      return;
    }

    // If there are no vaults, there are no passwords to fetch.
    if (folders.length === 0) {
        setPasswords([]);
        setIsLoadingPasswords(false);
        return;
    }

    setIsLoadingPasswords(true);
    
    // Create a query for each vault
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
        // We can't easily generate a permission error for a complex query like this,
        // so a console error is acceptable here for now. A more advanced implementation
        // could try to identify which vault failed.
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load credentials.' });
      })
      .finally(() => {
        setIsLoadingPasswords(false);
      });

  }, [user, firestore, folders, isLoadingFolders, toast]);


  const addFolder = (folderName: string) => {
     if (!user) return;
     const newFolderRef = doc(collection(firestore, 'users', user.uid, 'vaults'));
     const newFolder: Omit<Folder, 'id'> = { name: folderName };
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
    
    const dataToSave: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'> & { updatedAt: any, createdAt?: any } = {
      ...data,
      updatedAt: serverTimestamp(),
      ...(id ? {} : { createdAt: serverTimestamp() }),
    };

    setDoc(docRef, dataToSave, { merge: true })
      .then(() => {
          toast({ title: 'Success', description: id ? 'Password updated.' : 'Password added.' });
      })
      .catch(serverError => {
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

    const docRef = doc(firestore, 'users', user.uid, 'vaults', passwordToDelete.folderId, 'credentials', id);

    if (permanent) {
      deleteDoc(docRef)
        .then(() => {
            toast({ title: 'Success', description: 'Password permanently deleted.' });
        })
        .catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    } else {
      const updateData = { deletedAt: serverTimestamp(), updatedAt: serverTimestamp() };
      updateDoc(docRef, updateData)
        .then(() => {
            toast({ title: 'Success', description: 'Password moved to trash.' });
        })
        .catch(serverError => {
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
    
    const docRef = doc(firestore, 'users', user.uid, 'vaults', passwordToRestore.folderId, 'credentials', id);
    const updateData = { deletedAt: null, updatedAt: serverTimestamp() };
    
    updateDoc(docRef, updateData)
        .then(() => {
            toast({ title: 'Success', description: 'Password restored.' });
        })
        .catch(serverError => {
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

    const docRef = doc(firestore, 'users', user.uid, 'vaults', passwordToToggle.folderId, 'credentials', id);
    const updateData = { isFavorite: !isFavorite, updatedAt: serverTimestamp() };

    updateDoc(docRef, updateData)
        .catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: updateData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

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
    folders,
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

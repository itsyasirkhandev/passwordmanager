
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { type PasswordEntry, type PasswordFormValues } from '@/app/vault/password-form-dialog';
import type { Folder } from '@/components/folder-sidebar';
import { useToast } from '@/hooks/use-toast';

// Static folders for now. This could be moved to Firestore in the future.
const initialFolders: Folder[] = [
  { id: "1", name: "Personal" },
  { id: "2", name: "Work" },
  { id: "3", name: "Banking" },
];

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
  
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();

  // Memoize the collection reference for the user's credentials
  const credentialsCol = useMemoFirebase(() => {
    if (!user) return null;
    // This is a direct reference to the subcollection, which is correct.
    return collection(firestore, 'users', user.uid, 'credentials');
  }, [firestore, user]);

  // Fetch passwords using the useCollection hook
  const { data: passwords, isLoading: isLoadingPasswords } = useCollection<PasswordEntry>(credentialsCol);

  useEffect(() => {
    if (user) {
      const userDocRef = doc(firestore, 'users', user.uid);
      const dataToSave = {
        email: user.email,
        updatedAt: serverTimestamp(),
      };
      // Create or update the user document when the user logs in.
      // This is a 'get' then 'write' operation, which is allowed by the rules.
      setDoc(userDocRef, dataToSave, { merge: true }).catch(err => {
          console.error("Error creating/updating user document:", err);
      });
    }
  }, [user, firestore]);

  const addFolder = (folderName: string) => {
    const newFolder = { id: String(Date.now()), name: folderName };
    setFolders((prev) => [...prev, newFolder]);
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
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    const docRef = id ? doc(firestore, 'users', user.uid, 'credentials', id) : doc(collection(firestore, 'users', user.uid, 'credentials'));
    
    const dataToSave = {
      ...data,
      updatedAt: serverTimestamp(),
      ...(id ? {} : { createdAt: serverTimestamp() }),
    };

    try {
      await setDoc(docRef, dataToSave, { merge: true });
      toast({ title: 'Success', description: id ? 'Password updated.' : 'Password added.' });
    } catch (error) {
      console.error("Error saving password:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save password.' });
    }
  };

  const deletePassword = async (id: string, permanent = false) => {
    if (!user) return;
    const docRef = doc(firestore, 'users', user.uid, 'credentials', id);
    try {
      if (permanent) {
        await deleteDoc(docRef);
        toast({ title: 'Success', description: 'Password permanently deleted.' });
      } else {
        await updateDoc(docRef, { deletedAt: serverTimestamp(), updatedAt: serverTimestamp() });
        toast({ title: 'Success', description: 'Password moved to trash.' });
      }
    } catch (error) {
       console.error("Error deleting password:", error);
       toast({ variant: 'destructive', title: 'Error', description: 'Could not delete password.' });
    }
  };

  const restorePassword = async (id: string) => {
    if (!user) return;
    const docRef = doc(firestore, 'users', user.uid, 'credentials', id);
    try {
      await updateDoc(docRef, { deletedAt: null, updatedAt: serverTimestamp() });
      toast({ title: 'Success', description: 'Password restored.' });
    } catch (error) {
       console.error("Error restoring password:", error);
       toast({ variant: 'destructive', title: 'Error', description: 'Could not restore password.' });
    }
  };

  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    if (!user) return;
    const docRef = doc(firestore, 'users', user.uid, 'credentials', id);
    try {
        await updateDoc(docRef, { isFavorite: !isFavorite, updatedAt: serverTimestamp() });
    } catch (error) {
       console.error("Error updating favorite status:", error);
       toast({ variant: 'destructive', title: 'Error', description: 'Could not update favorite status.' });
    }
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

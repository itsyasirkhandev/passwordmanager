
"use client";

import React, { createContext, useContext, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { PasswordEntry } from '@/app/vault/password-list';
import type { Folder } from '@/components/folder-sidebar';

const initialFolders: Folder[] = [
  { id: "1", name: "Personal" },
  { id: "2", name: "Work" },
  { id: "3", name: "Banking" },
];

const initialPasswords: PasswordEntry[] = [
  {
    id: "1",
    serviceName: "Google",
    url: "https://google.com",
    username: "user@gmail.com",
    password: "supersecretpassword1",
    notes: "Security question: Favorite color is blue.",
    folderId: "1",
    tags: ["social", "important"],
    isFavorite: true,
    createdAt: new Date("2023-01-15T10:00:00Z"),
    updatedAt: new Date("2023-01-15T10:00:00Z"),
  },
  {
    id: "2",
    serviceName: "Facebook",
    url: "https://facebook.com",
    username: "user.name",
    password: "anotherSecurePassword!",
    notes: "",
    folderId: "1",
    tags: ["social"],
    isFavorite: false,
    createdAt: new Date("2023-02-20T11:00:00Z"),
    updatedAt: new Date("2023-03-01T15:30:00Z"),
  },
  {
    id: "3",
    serviceName: "GitHub",
    url: "https://github.com",
    username: "git-user",
    password: "my-repo-password-123",
    notes: "Used for work projects.",
    folderId: "2",
    tags: ["work", "dev"],
    isFavorite: true,
    createdAt: new Date("2023-03-10T09:00:00Z"),
    updatedAt: new Date("2023-04-10T09:00:00Z"),
  },
  {
    id: "4",
    serviceName: "Bank of America",
    url: "https://bankofamerica.com",
    username: "bank.user",
    password: "very-secure-banking-password",
    notes: "",
    folderId: "3",
    tags: ["banking", "important"],
    isFavorite: false,
    createdAt: new Date("2023-04-01T14:00:00Z"),
    updatedAt: new Date("2023-04-01T14:00:00Z"),
  },
  {
    id: "5",
    serviceName: "Netflix",
    url: "https://netflix.com",
    username: "streamingfan",
    password: "password",
    notes: "Basic plan",
    folderId: "1",
    tags: ["entertainment"],
    isFavorite: false,
    createdAt: new Date("2024-05-01T14:00:00Z"),
    updatedAt: new Date("2024-05-01T14:00:00Z"),
  },
  {
    id: "6",
    serviceName: "Amazon",
    url: "https://amazon.com",
    username: "shoppernew",
    password: "password123",
    notes: "",
    folderId: "1",
    tags: ["shopping"],
    isFavorite: false,
    createdAt: new Date("2024-06-11T14:00:00Z"),
    updatedAt: new Date("2024-06-11T14:00:00Z"),
  },
];

type VaultContextType = {
  passwords: PasswordEntry[];
  setPasswords: React.Dispatch<React.SetStateAction<PasswordEntry[]>>;
  folders: Folder[];
  addFolder: (folderName: string) => void;
  allTags: string[];
  selectedFolderId: string | null;
  selectFolder: (id: string | null) => void;
  selectedTag: string | null;
  selectTag: (tag: string | null) => void;
};

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [passwords, setPasswords] = useState<PasswordEntry[]>(initialPasswords);
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();

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

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    passwords.forEach(p => {
        if(!p.deletedAt) {
            p.tags?.forEach(tag => tags.add(tag));
        }
    });
    return Array.from(tags).sort();
  }, [passwords]);

  const value = {
    passwords,
    setPasswords,
    folders,
    addFolder,
    allTags,
    selectedFolderId,
    selectFolder,
    selectedTag,
    selectTag,
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

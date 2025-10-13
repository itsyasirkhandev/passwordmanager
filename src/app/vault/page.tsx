"use client";

import { useState } from "react";
import Header from "@/components/header";
import PasswordList, { type PasswordEntry } from "./password-list";
import { FolderSidebar, type Folder } from "@/components/folder-sidebar";
import { Trash2 } from "lucide-react";
import { useMemo } from "react";

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
  },
];


export default function VaultPage() {
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [passwords, setPasswords] = useState<PasswordEntry[]>(initialPasswords);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const handleAddFolder = (folderName: string) => {
    const newFolder = { id: String(Date.now()), name: folderName };
    setFolders((prev) => [...prev, newFolder]);
  };
  
  const handleSelectFolder = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    setSelectedTag(null); // Deselect tag when folder changes
  };

  const handleSelectTag = (tag: string | null) => {
    setSelectedTag(tag);
    setSelectedFolderId(null); // Deselect folder when tag changes
  }

  const specialFolders: Folder[] = [
    { id: "trash", name: "Trash", icon: Trash2 },
  ];

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    passwords.forEach(p => {
        if(!p.deletedAt) {
            p.tags?.forEach(tag => tags.add(tag));
        }
    });
    return Array.from(tags).sort();
  }, [passwords]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 grid md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
        <FolderSidebar
          folders={folders}
          specialFolders={specialFolders}
          tags={allTags}
          selectedFolderId={selectedFolderId}
          selectedTag={selectedTag}
          onSelectFolder={handleSelectFolder}
          onSelectTag={handleSelectTag}
          onAddFolder={handleAddFolder}
        />
        <div className="p-4 sm:p-6 lg:p-8">
            <PasswordList 
              passwords={passwords}
              setPasswords={setPasswords}
              selectedFolderId={selectedFolderId}
              selectedTag={selectedTag}
              folders={folders} 
            />
        </div>
      </main>
    </div>
  );
}

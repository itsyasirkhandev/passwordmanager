"use client";

import { useState } from "react";
import Header from "@/components/header";
import PasswordList from "./password-list";
import { FolderSidebar, type Folder } from "@/components/folder-sidebar";

const initialFolders: Folder[] = [
  { id: "1", name: "Personal" },
  { id: "2", name: "Work" },
  { id: "3", name: "Banking" },
];

export default function VaultPage() {
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const handleAddFolder = (folderName: string) => {
    const newFolder = { id: String(Date.now()), name: folderName };
    setFolders((prev) => [...prev, newFolder]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 grid md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
        <FolderSidebar
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          onAddFolder={handleAddFolder}
        />
        <div className="p-4 sm:p-6 lg:p-8">
            <PasswordList selectedFolderId={selectedFolderId} folders={folders} />
        </div>
      </main>
    </div>
  );
}

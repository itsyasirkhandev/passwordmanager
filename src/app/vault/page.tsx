
"use client";

import { useState } from "react";
import Header from "@/components/header";
import PasswordList from "./password-list";
import { FolderSidebar, MobileSidebar } from "@/components/folder-sidebar";
import { useVault } from "@/context/vault-context";


export default function VaultPage() {
  const { folders, addFolder, selectFolder, selectTag, allTags, selectedFolderId, selectedTag, passwords, setPasswords } = useVault();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      <MobileSidebar
        isOpen={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        folders={folders}
        tags={allTags}
        selectedFolderId={selectedFolderId}
        selectedTag={selectedTag}
        onSelectFolder={selectFolder}
        onSelectTag={selectTag}
        onAddFolder={addFolder}
      />
      <main className="flex-1 md:grid md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
        <aside className="hidden md:block">
          <FolderSidebar
            folders={folders}
            tags={allTags}
            selectedFolderId={selectedFolderId}
            selectedTag={selectedTag}
            onSelectFolder={selectFolder}
            onSelectTag={selectTag}
            onAddFolder={addFolder}
          />
        </aside>
        <div className="p-0 sm:p-6 lg:p-8 flex flex-col">
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

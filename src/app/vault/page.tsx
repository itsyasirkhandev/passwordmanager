
"use client";

import { useState } from "react";
import Header from "@/components/header";
import PasswordList from "./password-list";
import { FolderSidebar, MobileSidebar } from "@/components/folder-sidebar";
import { useVault } from "@/context/vault-context";
import { cn } from "@/lib/utils";
import withAuth from "@/components/withAuth";


function VaultPage() {
  const { folders, addFolder, selectFolder, selectTag, allTags, selectedFolderId, selectedTag, passwords, setPasswords } = useVault();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header onMenuClick={toggleSidebar} />
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onOpenChange={setIsMobileSidebarOpen}
        folders={folders}
        tags={allTags}
        selectedFolderId={selectedFolderId}
        selectedTag={selectedTag}
        onSelectFolder={selectFolder}
        onSelectTag={selectTag}
        onAddFolder={addFolder}
      />
      <main className={cn(
        "flex-1 md:grid",
        isDesktopSidebarOpen ? "md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]" : "md:grid-cols-[0_1fr]"
        )}>
        <aside className={cn("hidden md:block transition-all duration-300", isDesktopSidebarOpen ? "w-[280px] lg:w-[320px]" : "w-0")}>
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
        <div className="p-0 sm:p-6 lg:p-8 flex flex-col overflow-hidden">
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


export default withAuth(VaultPage);

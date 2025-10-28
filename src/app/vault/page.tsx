
"use client";

import { useState } from "react";
import Header from "@/components/header";
import PasswordList from "./password-list";
import { FolderSidebar, MobileSidebar } from "@/components/folder-sidebar";
import { useVault } from "@/context/vault-context";
import { cn } from "@/lib/utils";
import withAuth from "@/components/withAuth";


function VaultPage() {
  const { folders, addFolder, selectFolder, selectTag, allTags, selectedFolderId, selectedTag } = useVault();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false);
  const [addPasswordDialogOpen, setAddPasswordDialogOpen] = useState(false);
  const [viewPasswordId, setViewPasswordId] = useState<string | null>(null);

  const toggleSidebar = () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Header
        onMenuClick={toggleSidebar}
        onAddPassword={() => setAddPasswordDialogOpen(true)}
        onViewPassword={(id) => setViewPasswordId(id)}
      />
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
      <div className={cn(
        "flex-1 grid transition-all duration-300 overflow-hidden",
        isDesktopSidebarOpen ? "md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]" : "md:grid-cols-[80px_1fr]"
        )}>
        <aside className={cn("hidden md:block transition-all duration-300 overflow-y-auto", isDesktopSidebarOpen ? "w-[280px] lg:w-[320px]" : "w-[80px]")}>
          <FolderSidebar
            folders={folders}
            tags={allTags}
            selectedFolderId={selectedFolderId}
            selectedTag={selectedTag}
            onSelectFolder={selectFolder}
            onSelectTag={selectTag}
            onAddFolder={addFolder}
            isCollapsed={!isDesktopSidebarOpen}
          />
        </aside>
        <main className="p-0 sm:p-6 lg:p-8 flex flex-col overflow-hidden">
            <PasswordList
              selectedFolderId={selectedFolderId}
              selectedTag={selectedTag}
              folders={folders}
              externalAddPasswordOpen={addPasswordDialogOpen}
              onExternalAddPasswordChange={setAddPasswordDialogOpen}
              externalViewPasswordId={viewPasswordId}
              onExternalViewPasswordChange={setViewPasswordId}
            />
        </main>
      </div>
    </div>
  );
}


export default withAuth(VaultPage);


    

'use client';

import { useState } from 'react';
import Header from '@/components/header';
import { FolderSidebar, MobileSidebar } from '@/components/folder-sidebar';
import { useVault } from '@/context/vault-context';
import { cn } from '@/lib/utils';
import withAuth from '@/components/withAuth';
import ProviderList from './provider-list';

function ProvidersPage() {
  const { folders, addFolder, selectFolder, selectTag, allTags, selectedFolderId, selectedTag } = useVault();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false);

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
      <div className={cn(
        "flex-1 grid transition-all duration-300 overflow-hidden",
        isDesktopSidebarOpen ? "md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]" : "md:grid-cols-[80px_1fr]"
        )}>
        <aside className={cn("hidden md:block transition-all duration-300 overflow-hidden", isDesktopSidebarOpen ? "w-[280px] lg:w-[320px]" : "w-[80px]")}>
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
        <main className="overflow-y-auto p-4 sm:p-6 lg:p-8">
            <ProviderList />
        </main>
      </div>
    </div>
  );
}

export default withAuth(ProvidersPage);

    
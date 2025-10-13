
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Folder as FolderIcon, Plus, X, type LucideIcon, Tag, LayoutDashboard, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export type Folder = {
  id: string;
  name: string;
  icon?: LucideIcon;
};

type FolderSidebarProps = {
  folders: Folder[];
  tags: string[];
  selectedFolderId: string | null;
  selectedTag: string | null;
  onSelectFolder: (id: string | null) => void;
  onSelectTag: (tag: string | null) => void;
  onAddFolder: (name: string) => void;
  onClose?: () => void;
};

export function FolderSidebar({
  folders,
  tags,
  selectedFolderId,
  selectedTag,
  onSelectFolder,
  onSelectTag,
  onAddFolder,
  onClose,
}: FolderSidebarProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const pathname = usePathname();

  const handleAddClick = () => {
    setIsAdding(true);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewFolderName("");
  };

  const handleSaveNewFolder = () => {
    if (newFolderName.trim()) {
      onAddFolder(newFolderName.trim());
      handleCancelAdd();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveNewFolder();
    } else if (e.key === "Escape") {
      handleCancelAdd();
    }
  };

  const handleSelectAll = () => {
    onSelectFolder(null);
    onSelectTag(null);
    onClose?.();
  };
  
  const handleFolderSelect = (id: string | null) => {
    onSelectFolder(id);
    onClose?.();
  }

  const handleTagSelect = (tag: string | null) => {
    onSelectTag(tag);
    onClose?.();
  }

  const specialFolders: Folder[] = [
    { id: "favorites", name: "Favorites", icon: Star },
    { id: "trash", name: "Trash", icon: Trash2 },
  ];
  
  const isVaultPage = pathname === '/vault' || pathname === '/dashboard';

  const content = (
    <>
      <nav className="flex flex-col gap-1">
        <Button
            variant={pathname === "/dashboard" ? "secondary" : "ghost"}
            className="w-full justify-start text-base"
            asChild
          >
            <Link href="/dashboard" onClick={onClose}>
              <LayoutDashboard className="mr-3 h-5 w-5" />
              Dashboard
            </Link>
        </Button>
        <Button
          variant={pathname === '/vault' && selectedFolderId === null && selectedTag === null ? "secondary" : "ghost"}
          className="w-full justify-start text-base"
          onClick={handleSelectAll}
          asChild={pathname !== '/vault'}
        >
          {pathname === '/vault' ? (
            <>
              <FolderIcon className="mr-3 h-5 w-5" />
              All Passwords
            </>
          ) : (
            <Link href="/vault" onClick={onClose}>
              <FolderIcon className="mr-3 h-5 w-5" />
              All Passwords
            </Link>
          )}
        </Button>
      </nav>

      <Separator />
      
      <h2 className="text-lg font-semibold tracking-tight -mb-2 px-2">Folders</h2>
      <nav className="flex flex-col gap-1">
        {folders.map((folder) => (
          <Button
            key={folder.id}
            variant={pathname === '/vault' && selectedFolderId === folder.id ? "secondary" : "ghost"}
            className="w-full justify-start text-base"
            onClick={() => handleFolderSelect(folder.id)}
          >
            <FolderIcon className="mr-3 h-5 w-5" />
            {folder.name}
          </Button>
        ))}
      </nav>

      {tags.length > 0 && (
        <>
          <Separator />
          <h2 className="text-lg font-semibold tracking-tight -mb-2 px-2">Tags</h2>
          <nav className="flex flex-col gap-1">
            {tags.map((tag) => (
              <Button
                key={tag}
                variant={pathname === '/vault' && selectedTag === tag ? "secondary" : "ghost"}
                className="w-full justify-start text-base"
                onClick={() => handleTagSelect(tag)}
              >
                <Tag className="mr-3 h-5 w-5" />
                {tag}
              </Button>
            ))}
          </nav>
        </>
      )}

      {specialFolders.length > 0 && (
        <>
          <Separator />
          <nav className="flex flex-col gap-1">
            {specialFolders.map((folder) => {
              const Icon = folder.icon || FolderIcon;
              return (
                <Button
                  key={folder.id}
                  variant={pathname === '/vault' && selectedFolderId === folder.id ? "secondary" : "ghost"}
                  className="w-full justify-start text-base"
                  onClick={() => handleFolderSelect(folder.id)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {folder.name}
                </Button>
              );
            })}
          </nav>
        </>
      )}

      <div className="mt-auto">
        {isAdding ? (
          <div className="space-y-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="New folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pr-8"
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-0 top-0 h-full"
                onClick={handleCancelAdd}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleSaveNewFolder} className="w-full">
              Save Folder
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={handleAddClick}>
            <Plus className="mr-2 h-5 w-5" />
            New Folder
          </Button>
        )}
      </div>
    </>
  );

  return (
    <div className="border-r bg-muted/40 p-4 flex flex-col gap-4 h-full">
      {content}
    </div>
  );
}

type MobileSidebarProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
} & Omit<FolderSidebarProps, 'onClose'>;

export function MobileSidebar({ isOpen, onOpenChange, ...props}: MobileSidebarProps) {
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="p-0 w-full max-w-xs">
                <div className="p-4 flex flex-col gap-4 h-full">
                    <SheetHeader className="px-2">
                      <SheetTitle className="text-2xl font-bold tracking-tight text-left">CipherVault</SheetTitle>
                    </SheetHeader>
                    <FolderSidebar {...props} onClose={() => onOpenChange(false)} />
                </div>
            </SheetContent>
        </Sheet>
    )
}

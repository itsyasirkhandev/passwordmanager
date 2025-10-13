"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Folder as FolderIcon, Plus, X, type LucideIcon, Tag, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";

export type Folder = {
  id: string;
  name: string;
  icon?: LucideIcon;
};

type FolderSidebarProps = {
  folders: Folder[];
  specialFolders?: Folder[];
  tags: string[];
  selectedFolderId: string | null;
  selectedTag: string | null;
  onSelectFolder: (id: string | null) => void;
  onSelectTag: (tag: string | null) => void;
  onAddFolder: (name: string) => void;
};

export function FolderSidebar({
  folders,
  specialFolders = [],
  tags,
  selectedFolderId,
  selectedTag,
  onSelectFolder,
  onSelectTag,
  onAddFolder,
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
  };
  
  const isVaultPage = pathname === '/vault';

  return (
    <div className="border-r bg-muted/40 p-4 flex flex-col gap-4">
      <nav className="flex flex-col gap-1">
        <Button
            variant={pathname === "/dashboard" ? "secondary" : "ghost"}
            className="w-full justify-start"
            asChild
          >
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2" />
              Dashboard
            </Link>
        </Button>
        <Button
          variant={isVaultPage && selectedFolderId === null && selectedTag === null ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={handleSelectAll}
          asChild={!isVaultPage}
        >
          {isVaultPage ? (
            <>
              <FolderIcon className="mr-2" />
              All Passwords
            </>
          ) : (
            <Link href="/vault">
              <FolderIcon className="mr-2" />
              All Passwords
            </Link>
          )}
        </Button>
      </nav>

      <Separator />
      
      <h2 className="text-lg font-semibold tracking-tight -mb-2">Folders</h2>
      <nav className="flex flex-col gap-1">
        {folders.map((folder) => (
          <Button
            key={folder.id}
            variant={isVaultPage && selectedFolderId === folder.id ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => onSelectFolder(folder.id)}
          >
            <FolderIcon className="mr-2" />
            {folder.name}
          </Button>
        ))}
      </nav>

      {tags.length > 0 && (
        <>
          <Separator />
          <h2 className="text-lg font-semibold tracking-tight -mb-2">Tags</h2>
          <nav className="flex flex-col gap-1">
            {tags.map((tag) => (
              <Button
                key={tag}
                variant={isVaultPage && selectedTag === tag ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => onSelectTag(tag)}
              >
                <Tag className="mr-2" />
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
                  variant={isVaultPage && selectedFolderId === folder.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => onSelectFolder(folder.id)}
                >
                  <Icon className="mr-2" />
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
            <Plus className="mr-2" />
            New Folder
          </Button>
        )}
      </div>
    </div>
  );
}

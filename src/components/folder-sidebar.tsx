"use client";

import { useState } from "react";
import { Folder as FolderIcon, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";

export type Folder = {
  id: string;
  name: string;
};

type FolderSidebarProps = {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onAddFolder: (name: string) => void;
};

export function FolderSidebar({
  folders,
  selectedFolderId,
  onSelectFolder,
  onAddFolder,
}: FolderSidebarProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

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

  return (
    <div className="border-r bg-muted/40 p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold tracking-tight">Folders</h2>
      <nav className="flex flex-col gap-1">
        <Button
          variant={selectedFolderId === null ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => onSelectFolder(null)}
        >
          <FolderIcon className="mr-2" />
          All Passwords
        </Button>
        {folders.map((folder) => (
          <Button
            key={folder.id}
            variant={selectedFolderId === folder.id ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => onSelectFolder(folder.id)}
          >
            <FolderIcon className="mr-2" />
            {folder.name}
          </Button>
        ))}
      </nav>
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

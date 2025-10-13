
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Folder as FolderIcon, Plus, X, type LucideIcon, Tag, LayoutDashboard, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";


export type Folder = {
  id: string;
  name: string;
  icon?: LucideIcon;
};

type NavLinkProps = {
    href?: string;
    onClick?: () => void;
    isActive: boolean;
    isCollapsed: boolean;
    label: string;
    icon: LucideIcon;
    asChild?: boolean;
}

const NavLink = ({ href, onClick, isActive, isCollapsed, label, icon: Icon, asChild }: NavLinkProps) => {
    const content = (
        <>
            <Icon className={cn("h-5 w-5", isCollapsed ? "mx-auto" : "mr-3")} />
            {!isCollapsed && label}
        </>
    );
    
    const button = (
         <Button
            variant={isActive && !isCollapsed ? "secondary" : "ghost"}
            className={cn(
              "w-full text-base", 
              isCollapsed ? "justify-center px-0" : "justify-start",
              isActive && (isCollapsed ? "text-primary" : "bg-primary/10 text-primary hover:bg-primary/20")
            )}
            onClick={onClick}
            asChild={asChild}
        >
            {href ? <Link href={href}>{content}</Link> : content}
        </Button>
    )

    if (isCollapsed) {
        return (
            <TooltipProvider>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        {button}
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {label}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    return button;
}

type FolderSidebarProps = {
  folders: Folder[];
  tags: string[];
  selectedFolderId: string | null;
  selectedTag: string | null;
  onSelectFolder: (id: string | null) => void;
  onSelectTag: (tag: string | null) => void;
  onAddFolder: (name: string) => void;
  onClose?: () => void;
  isCollapsed?: boolean;
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
  isCollapsed = false,
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
    if (pathname !== '/vault') {
      // This will be handled by the Link component's onClick if it's not the vault page
    } else {
       onClose?.();
    }
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
  
  const isVaultPage = pathname === '/vault';

  const content = (
    <TooltipProvider>
        <nav className="flex flex-col gap-1">
            <NavLink 
                href="/dashboard"
                onClick={onClose}
                isActive={pathname === "/dashboard"}
                isCollapsed={isCollapsed}
                label="Dashboard"
                icon={LayoutDashboard}
                asChild
            />
            <NavLink 
                href={isVaultPage ? undefined : "/vault"}
                onClick={isVaultPage ? handleSelectAll : onClose}
                isActive={isVaultPage && selectedFolderId === null && selectedTag === null}
                isCollapsed={isCollapsed}
                label="All Passwords"
                icon={FolderIcon}
                asChild={!isVaultPage}
            />
        </nav>

        <Separator />
        
        {!isCollapsed && <h2 className="text-lg font-semibold tracking-tight -mb-2 px-2">Folders</h2>}
        <nav className="flex flex-col gap-1">
            {folders && folders.map((folder) => (
            <NavLink
                key={folder.id}
                onClick={() => handleFolderSelect(folder.id)}
                isActive={pathname === '/vault' && selectedFolderId === folder.id}
                isCollapsed={isCollapsed}
                label={folder.name}
                icon={FolderIcon}
            />
            ))}
        </nav>

        {tags && tags.length > 0 && (
            <>
            <Separator />
            {!isCollapsed && <h2 className="text-lg font-semibold tracking-tight -mb-2 px-2">Tags</h2>}
            <nav className="flex flex-col gap-1">
                {tags.map((tag) => (
                <NavLink
                    key={tag}
                    onClick={() => handleTagSelect(tag)}
                    isActive={pathname === '/vault' && selectedTag === tag}
                    isCollapsed={isCollapsed}
                    label={tag}
                    icon={Tag}
                />
                ))}
            </nav>
            </>
        )}

        {specialFolders.length > 0 && (
            <>
            <Separator />
            <nav className="flex flex-col gap-1">
                {specialFolders.map((folder) => (
                <NavLink
                    key={folder.id}
                    onClick={() => handleFolderSelect(folder.id)}
                    isActive={pathname === '/vault' && selectedFolderId === folder.id}
                    isCollapsed={isCollapsed}
                    label={folder.name}
                    icon={folder.icon || FolderIcon}
                />
                ))}
            </nav>
            </>
        )}

        <div className="mt-auto">
            {isAdding ? (
            <div className="space-y-2">
                {!isCollapsed && (
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
                )}
                <Button onClick={handleSaveNewFolder} className="w-full">
                   {!isCollapsed ? 'Save Folder' : <Plus className="h-5 w-5" />}
                </Button>
            </div>
            ) : (
                <Button variant="outline" className="w-full" onClick={handleAddClick}>
                    <Plus className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
                    {!isCollapsed && 'New Folder'}
                </Button>
            )}
        </div>
    </TooltipProvider>
  );

  return (
    <div className={cn("bg-muted/40 p-4 flex flex-col gap-4 h-full overflow-y-auto", isCollapsed && "items-center")}>
      {content}
    </div>
  );
}

type MobileSidebarProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
} & Omit<FolderSidebarProps, 'onClose' | 'isCollapsed'>;

export function MobileSidebar({ isOpen, onOpenChange, ...props}: MobileSidebarProps) {
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="p-0 w-full max-w-xs flex flex-col">
                 <SheetHeader className="p-4 border-b">
                    <SheetTitle className="text-2xl font-bold tracking-tight text-left">CipherVault</SheetTitle>
                    <SheetDescription className="text-left">A clean and secure password manager.</SheetDescription>
                </SheetHeader>
                <div className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto">
                    <FolderSidebar {...props} onClose={() => onOpenChange(false)} isCollapsed={false} />
                </div>
            </SheetContent>
        </Sheet>
    )
}

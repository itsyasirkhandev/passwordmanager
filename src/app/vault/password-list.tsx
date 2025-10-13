
"use client";

import { useState, useMemo, useEffect } from "react";
import { Eye, EyeOff, PlusCircle, ClipboardCopy, Check, Search, X, MoreHorizontal, Pencil, Trash2, Undo, ShieldAlert, KeyRound, Star, Filter, SortAsc, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordFormDialog, type PasswordEntry, type PasswordFormValues } from "./password-form-dialog";
import { PasswordDetailSheet } from "./password-detail-sheet";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { type Folder } from "@/components/folder-sidebar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PasswordStrengthPill } from "@/components/password-strength-indicator";
import { ExportDialog } from "./export-dialog";


export type { PasswordEntry };

type SortOption = "updatedAt_desc" | "updatedAt_asc" | "createdAt_desc" | "createdAt_asc" | "serviceName_asc" | "serviceName_desc";
type FilterOption = "all" | "favorites";

type PasswordListProps = {
  passwords: PasswordEntry[];
  setPasswords: React.Dispatch<React.SetStateAction<PasswordEntry[]>>;
  selectedFolderId: string | null;
  selectedTag: string | null;
  folders: Folder[];
};

export default function PasswordList({ passwords, setPasswords, selectedFolderId, selectedTag, folders }: PasswordListProps) {
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [viewingPassword, setViewingPassword] = useState<PasswordEntry | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ ids: string[], permanent: boolean } | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("updatedAt_desc");
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const { toast } = useToast();

  const isTrashView = selectedFolderId === 'trash';

  const filteredAndSortedPasswords = useMemo(() => {
    let filtered = isTrashView
      ? passwords.filter(p => p.deletedAt)
      : passwords.filter(p => !p.deletedAt);

    if (activeFilter === 'favorites') {
        filtered = filtered.filter(p => p.isFavorite);
    }
    
    if (selectedFolderId && selectedFolderId !== 'trash' && selectedFolderId !== 'favorites') {
      filtered = filtered.filter(p => p.folderId === selectedFolderId);
    } else if (selectedFolderId === 'favorites') {
        filtered = filtered.filter(p => p.isFavorite);
    } else if (selectedTag) {
      filtered = filtered.filter(p => p.tags?.includes(selectedTag));
    }
    
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.serviceName.toLowerCase().includes(lowercasedQuery) ||
          p.username.toLowerCase().includes(lowercasedQuery) ||
          p.url?.toLowerCase().includes(lowercasedQuery) ||
          p.notes?.toLowerCase().includes(lowercasedQuery) ||
          p.tags?.some(tag => tag.toLowerCase().includes(lowercasedQuery))
      );
    }

    return [...filtered].sort((a, b) => {
        switch (sortOption) {
            case 'serviceName_asc':
                return a.serviceName.localeCompare(b.serviceName);
            case 'serviceName_desc':
                return b.serviceName.localeCompare(a.serviceName);
            case 'createdAt_asc':
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'createdAt_desc':
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'updatedAt_asc':
                return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
            case 'updatedAt_desc':
            default:
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
    });
  }, [passwords, searchQuery, selectedFolderId, selectedTag, isTrashView, sortOption, activeFilter]);

  useEffect(() => {
    setSelectedIds([]);
  }, [selectedFolderId, selectedTag, searchQuery, sortOption, activeFilter]);
  
  // Close detail view if the item is no longer in the filtered list
  useEffect(() => {
    if (viewingPassword && !filteredAndSortedPasswords.find(p => p.id === viewingPassword.id)) {
      setViewingPassword(null);
    }
  }, [viewingPassword, filteredAndSortedPasswords]);

  const handleCopy = (text: string, fieldId: string, isPassword = false) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedField(fieldId);
        toast({ title: "Copied to clipboard!" });
        setTimeout(() => setCopiedField(null), 2000);
        if (isPassword) {
          setTimeout(() => {
            navigator.clipboard.writeText("").then(() => {
              toast({ title: "Clipboard cleared for security.", description: "The copied password has been removed from your clipboard." });
            });
          }, 60000);
        }
      },
      (err) => {
        console.error("Could not copy text: ", err);
        toast({ variant: "destructive", title: "Failed to copy" });
      }
    );
  };

  const togglePasswordVisibility = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenAddForm = () => {
    setEditingPassword(null);
    setIsFormOpen(true);
  }

  const handleOpenEditForm = (password: PasswordEntry) => {
    setEditingPassword(password);
    setIsFormOpen(true);
    setViewingPassword(null);
  }
  
  const handleOpenDetailView = (password: PasswordEntry) => {
    setViewingPassword(password);
  }

  const handleSubmitPassword = (data: PasswordFormValues) => {
    const now = new Date();
    if (editingPassword) {
      const updatedPassword = { ...editingPassword, ...data, updatedAt: now };
      setPasswords(passwords.map(p => p.id === editingPassword.id ? updatedPassword : p));
      setViewingPassword(updatedPassword); // Update detail view if open
      toast({ title: "Success", description: "Password updated." });
    } else {
      const newPassword: PasswordEntry = { ...data, id: String(Date.now()), createdAt: now, updatedAt: now };
      setPasswords([...passwords, newPassword]);
      toast({ title: "Success", description: "Password added to your vault." });
    }
    setIsFormOpen(false);
    setEditingPassword(null);
  };

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredAndSortedPasswords.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };
  
  const handleDeleteRequest = (ids: string[], permanent = false) => {
    setDeleteConfirmation({ ids, permanent });
  };

  const confirmDelete = () => {
    if (!deleteConfirmation) return;
    const { ids, permanent } = deleteConfirmation;

    if (permanent) {
        setPasswords(prev => prev.filter(p => !ids.includes(p.id)));
        toast({ title: `${ids.length} item(s) permanently deleted.` });
    } else {
        const now = new Date();
        setPasswords(prev => prev.map(p => ids.includes(p.id) ? { ...p, deletedAt: now, updatedAt: now } : p));
        toast({ title: `${ids.length} item(s) moved to trash.` });
    }
    
    if (viewingPassword && ids.includes(viewingPassword.id)) {
      setViewingPassword(null);
    }
    
    setSelectedIds([]);
    setDeleteConfirmation(null);
  };

  const handleRestore = (ids: string[]) => {
    const now = new Date();
    setPasswords(prev => prev.map(p => ids.includes(p.id) ? { ...p, deletedAt: undefined, updatedAt: now } : p));
    toast({ title: `${ids.length} item(s) restored.` });
    setSelectedIds([]);
  }

  const toggleFavorite = (id: string) => {
    const now = new Date();
    const newPasswords = passwords.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite, updatedAt: now } : p);
    setPasswords(newPasswords);
    if (viewingPassword?.id === id) {
        setViewingPassword(newPasswords.find(p => p.id === id) || null);
    }
  };

  const clearFilters = () => {
    setActiveFilter("all");
    setSearchQuery("");
  }

  const BulkActions = () => {
      if(selectedIds.length === 0) return null;

      if(isTrashView) {
          return (
              <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleRestore(selectedIds)}>
                      <Undo className="mr-2 h-4 w-4" /> Restore ({selectedIds.length})
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteRequest(selectedIds, true)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedIds.length})
                  </Button>
              </div>
          )
      }

      return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsExportOpen(true)}>
                <Download className="mr-2 h-4 w-4" /> Export ({selectedIds.length})
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleDeleteRequest(selectedIds)}>
              <Trash2 className="mr-2 h-4 w-4" /> Trash ({selectedIds.length})
            </Button>
        </div>
      )
  };

  const currentFolder = folders.find(f => f.id === selectedFolderId);
  
  const getTitle = () => {
    if (isTrashView) return "Trash";
    if (selectedFolderId === 'favorites') return "Favorites";
    if (selectedTag) return `Tagged: "${selectedTag}"`;
    if (currentFolder) return currentFolder.name;
    return "All Passwords";
  };
  const folderTitle = getTitle();

  return (
    <>
      <Card className="shadow-lg h-full flex flex-col border-0 sm:border">
        <CardHeader className="pt-2 sm:pt-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex-1">
                <CardTitle>{folderTitle}</CardTitle>
                {isTrashView && <p className="text-sm text-muted-foreground mt-1">Items in the trash will be permanently deleted after 30 days.</p>}
            </div>
            <div className="flex w-full sm:w-auto items-center gap-2">
                {!isTrashView && (
                    <>
                        <Button variant="outline" onClick={() => setIsExportOpen(true)} className="hidden sm:inline-flex">
                            <Download className="mr-2 h-4 w-4" /> Export
                        </Button>
                        <Button onClick={handleOpenAddForm} className="whitespace-nowrap w-full sm:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Password
                        </Button>
                    </>
                )}
            </div>
          </div>
           <div className="flex flex-col sm:flex-row items-center gap-2 pt-4">
                <div className="relative w-full flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search vault..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                    {searchQuery && (
                        <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setSearchQuery("")}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                                <Filter className="mr-2 h-4 w-4" /> Filter
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Show</DropdownMenuLabel>
                            <DropdownMenuRadioGroup value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterOption)}>
                                <DropdownMenuRadioItem value="all">All Items</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="favorites">Favorites</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                                <SortAsc className="mr-2 h-4 w-4" /> Sort
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                            <DropdownMenuRadioGroup value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                                <DropdownMenuRadioItem value="updatedAt_desc">Last Modified</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="createdAt_desc">Date Added</DropdownMenuRadioItem>
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>Service Name</DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuRadioItem value="serviceName_asc">A-Z</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="serviceName_desc">Z-A</DropdownMenuRadioItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            {(activeFilter !== 'all' || searchQuery) && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                    <span className="text-sm font-medium">Active Filters:</span>
                    {activeFilter !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                            {activeFilter === 'favorites' && 'Favorites'}
                            <button onClick={() => setActiveFilter('all')} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {searchQuery && (
                         <Badge variant="secondary" className="gap-1">
                            Search: "{searchQuery}"
                            <button onClick={() => setSearchQuery('')} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    <Button variant="link" size="sm" className="h-auto p-0 text-primary" onClick={clearFilters}>Clear all filters</Button>
                </div>
            )}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 sm:p-6 sm:pt-0">
          {selectedIds.length > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-md flex flex-col sm:flex-row items-center justify-between gap-2">
                <p className="text-sm font-medium">{selectedIds.length} of {filteredAndSortedPasswords.length} selected</p>
                <BulkActions />
            </div>
          )}
          <div className="border-t sm:border sm:rounded-md flex-1">
            <Table>
              <TableHeader className="hidden md:table-header-group">
                <TableRow>
                  <TableHead className="w-[50px]">
                     <Checkbox
                        checked={filteredAndSortedPasswords.length > 0 && selectedIds.length === filteredAndSortedPasswords.length}
                        onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                        aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="w-[30px]"></TableHead>
                  <TableHead className="w-[25%]">Service</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedPasswords.map((entry) => (
                  <TableRow 
                    key={entry.id} 
                    data-state={selectedIds.includes(entry.id) && "selected"}
                    className="cursor-pointer md:table-row flex flex-col md:flex-row p-4 md:p-0 border-b"
                    onClick={() => handleOpenDetailView(entry)}
                  >
                    <TableCell className="w-[50px] hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                         <Checkbox
                            checked={selectedIds.includes(entry.id)}
                            onCheckedChange={(checked) => handleSelect(entry.id, Boolean(checked))}
                            aria-label={`Select ${entry.serviceName}`}
                        />
                    </TableCell>
                    <TableCell className="w-[30px] hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFavorite(entry.id)}
                            aria-label={entry.isFavorite ? "Remove from favorites" : "Add to favorites"}
                            className="h-8 w-8"
                        >
                            <Star className={cn("h-4 w-4", entry.isFavorite ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
                        </Button>
                    </TableCell>
                    <TableCell className="font-medium p-0 md:p-4">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className="md:hidden" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    checked={selectedIds.includes(entry.id)}
                                    onCheckedChange={(checked) => handleSelect(entry.id, Boolean(checked))}
                                    aria-label={`Select ${entry.serviceName}`}
                                />
                            </div>
                            <span className="font-semibold text-base">{entry.serviceName}</span>
                         </div>
                        <div className="md:hidden" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {!isTrashView && (
                                        <>
                                            <DropdownMenuItem onClick={() => handleOpenEditForm(entry)}>
                                                <Pencil className="mr-2" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => toggleFavorite(entry.id)}>
                                                <Star className={cn("mr-2", entry.isFavorite ? "text-yellow-400 fill-yellow-400" : "")} /> 
                                                {entry.isFavorite ? "Unfavorite" : "Favorite"}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleCopy(entry.username, `${entry.id}-username`)}>
                                                <ClipboardCopy className="mr-2" /> Copy Username
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleCopy(entry.password, `${entry.id}-password`, true)}>
                                                <KeyRound className="mr-2" /> Copy Password
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteRequest([entry.id])}>
                                                <Trash2 className="mr-2" /> Move to Trash
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    {isTrashView && (
                                        <>
                                            <DropdownMenuItem onClick={() => handleRestore([entry.id])}>
                                                <Undo className="mr-2" /> Restore
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteRequest([entry.id], true)}>
                                                <ShieldAlert className="mr-2" /> Delete Permanently
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                      </div>
                      <div className="text-muted-foreground text-sm pl-8 md:pl-0">{entry.username}</div>
                       {entry.tags && entry.tags.length > 0 && !isTrashView && (
                          <div className="flex flex-wrap gap-1 mt-2 pl-8 md:pl-0">
                            {entry.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono flex-1 truncate">
                          {entry.username}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handleCopy(entry.username, `${entry.id}-username`); }}
                          aria-label="Copy username"
                        >
                          {copiedField === `${entry.id}-username` ? <Check className="h-4 w-4 text-primary" /> : <ClipboardCopy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center justify-between gap-2">
                         <div className="flex flex-col gap-1.5 flex-1">
                           <span className="font-mono">
                             {revealedPasswords[entry.id] ? entry.password : "••••••••••••"}
                           </span>
                           {!isTrashView && <PasswordStrengthPill password={entry.password} />}
                         </div>
                        <div className="flex items-center">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); togglePasswordVisibility(entry.id); }} aria-label={revealedPasswords[entry.id] ? "Hide password" : "Show password"}>
                            {revealedPasswords[entry.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                           <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleCopy(entry.password, `${entry.id}-password`, true); }} aria-label="Copy password">
                             {copiedField === `${entry.id}-password` ? <Check className="h-4 w-4 text-primary" /> : <ClipboardCopy className="h-4 w-4" />}
                           </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {!isTrashView && (
                                    <>
                                        <DropdownMenuItem onClick={() => handleOpenEditForm(entry)}>
                                            <Pencil className="mr-2" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => toggleFavorite(entry.id)}>
                                            <Star className={cn("mr-2", entry.isFavorite ? "text-yellow-400 fill-yellow-400" : "")} /> 
                                            {entry.isFavorite ? "Unfavorite" : "Favorite"}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleCopy(entry.username, `${entry.id}-username`)}>
                                            <ClipboardCopy className="mr-2" /> Copy Username
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleCopy(entry.password, `${entry.id}-password`, true)}>
                                            <KeyRound className="mr-2" /> Copy Password
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteRequest([entry.id])}>
                                            <Trash2 className="mr-2" /> Move to Trash
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {isTrashView && (
                                    <>
                                        <DropdownMenuItem onClick={() => handleRestore([entry.id])}>
                                            <Undo className="mr-2" /> Restore
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteRequest([entry.id], true)}>
                                            <ShieldAlert className="mr-2" /> Delete Permanently
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {(filteredAndSortedPasswords.length === 0) && (
            <div className="text-center py-12 text-muted-foreground flex-1 flex flex-col justify-center items-center">
              {searchQuery ? (
                <>
                  <p className="font-semibold text-lg">No results found</p>
                  <p>Your search for "{searchQuery}" did not match any items.</p>
                  <Button variant="link" onClick={clearFilters} className="mt-2">Clear all filters</Button>
                </>
              ) : activeFilter !== 'all' ? (
                <>
                    <p className="font-semibold text-lg">No items match your filter</p>
                    <p>There are no {activeFilter === 'favorites' ? 'favorites' : ''} in this view.</p>
                    <Button variant="link" onClick={() => setActiveFilter('all')} className="mt-2">Show all items</Button>
                </>
              ) : (
                <>
                  <p>{isTrashView ? "Trash is empty." : "Your vault is empty for this selection."}</p>
                  {!isTrashView && !selectedTag && <p>Click "Add Password" to get started.</p>}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <PasswordFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmitPassword}
        initialData={editingPassword}
        folders={folders}
        defaultFolderId={selectedFolderId}
      />
      <PasswordDetailSheet
        entry={viewingPassword}
        isOpen={!!viewingPassword}
        onOpenChange={(open) => !open && setViewingPassword(null)}
        onEdit={handleOpenEditForm}
        onDelete={(id) => handleDeleteRequest([id], isTrashView)}
        onToggleFavorite={toggleFavorite}
        onCopy={handleCopy}
        isTrashView={isTrashView}
        onRestore={id => handleRestore([id])}
      />
       <AlertDialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmation?.permanent 
                ? "This action cannot be undone. This will permanently delete the selected password(s)."
                : "This action will move the selected password(s) to the trash."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmation(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className={buttonVariants({ variant: "destructive" })}>
              {deleteConfirmation?.permanent ? "Delete Permanently" : "Move to Trash"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ExportDialog
        isOpen={isExportOpen}
        onOpenChange={setIsExportOpen}
        allPasswords={passwords}
        filteredPasswords={filteredAndSortedPasswords}
        selectedIds={selectedIds}
        folders={folders}
        currentFolderId={selectedFolderId}
        currentTag={selectedTag}
        isTrashView={isTrashView}
       />
    </>
  );
}


"use client";

import { useState, useMemo, useEffect } from "react";
import { Eye, EyeOff, PlusCircle, Copy, Check, Search, X, MoreHorizontal, Pencil, Trash2, Undo, ShieldAlert, KeyRound, Star, Filter, SortAsc, Download, User as UserIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PasswordFormDialog, type PasswordEntry, type PasswordFormValues } from "./password-form-dialog";
import { PasswordDetailSheet } from "./password-detail-sheet";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useVault } from "@/context/vault-context";
import { Skeleton } from "@/components/ui/skeleton";


export type { PasswordEntry };

type SortOption = "updatedAt_desc" | "updatedAt_asc" | "createdAt_desc" | "createdAt_asc" | "serviceName_asc" | "serviceName_desc";
type FilterOption = "all" | "favorites";

type PasswordListProps = {
  selectedFolderId: string | null;
  selectedTag: string | null;
  folders: Folder[];
};

export default function PasswordList({ selectedFolderId, selectedTag, folders }: PasswordListProps) {
  const { 
    passwords, 
    isLoadingPasswords,
    addOrUpdatePassword, 
    deletePassword,
    restorePassword,
    toggleFavorite,
    getDecryptedPassword,
  } = useVault();

  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [viewingPasswordId, setViewingPasswordId] = useState<string | null>(null);
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

    if (activeFilter === 'favorites' && !isTrashView) {
        filtered = filtered.filter(p => p.isFavorite);
    }
    
    if (selectedFolderId && selectedFolderId !== 'trash' && selectedFolderId !== 'favorites') {
      filtered = filtered.filter(p => p.folderId === selectedFolderId);
    } else if (selectedFolderId === 'favorites' && !isTrashView) {
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

    const toDate = (val: any) => val?.toDate ? val.toDate() : val;
    
    return [...filtered].sort((a, b) => {
        switch (sortOption) {
            case 'serviceName_asc':
                return a.serviceName.localeCompare(b.serviceName);
            case 'serviceName_desc':
                return b.serviceName.localeCompare(a.serviceName);
            case 'createdAt_asc':
                return toDate(a.createdAt).getTime() - toDate(b.createdAt).getTime();
            case 'createdAt_desc':
                return toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime();
            case 'updatedAt_asc':
                return toDate(a.updatedAt).getTime() - toDate(b.updatedAt).getTime();
            case 'updatedAt_desc':
            default:
                return toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime();
        }
    });
  }, [passwords, searchQuery, selectedFolderId, selectedTag, isTrashView, sortOption, activeFilter]);
  
  const viewingPassword = useMemo(() => {
    if (!viewingPasswordId) return null;
    return passwords.find(p => p.id === viewingPasswordId) ?? null;
  }, [viewingPasswordId, passwords]);

  useEffect(() => {
    setSelectedIds([]);
  }, [selectedFolderId, selectedTag, searchQuery, sortOption, activeFilter, passwords]);
  
  useEffect(() => {
    if (viewingPasswordId && !filteredAndSortedPasswords.find(p => p.id === viewingPasswordId)) {
      setViewingPasswordId(null);
    }
  }, [viewingPasswordId, filteredAndSortedPasswords]);

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
    setViewingPasswordId(null);
  }
  
  const handleOpenDetailView = (password: PasswordEntry) => {
    setViewingPasswordId(password.id);
  }

  const handleSubmitPassword = async (data: PasswordFormValues) => {
    await addOrUpdatePassword(data, editingPassword?.id);
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

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    const { ids, permanent } = deleteConfirmation;
    
    await Promise.all(ids.map(id => deletePassword(id, permanent)));

    if (viewingPasswordId && ids.includes(viewingPasswordId)) {
      setViewingPasswordId(null);
    }
    
    setSelectedIds([]);
    setDeleteConfirmation(null);
  };

  const handleRestore = (ids: string[]) => {
    Promise.all(ids.map(id => restorePassword(id)));
    setSelectedIds([]);
  }

  const handleToggleFavorite = (id: string, isFavorite: boolean) => {
    toggleFavorite(id, isFavorite);
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

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-1" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-5 w-full" />
                </div>
                <div className="space-y-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-5 w-full" />
                </div>
            </CardContent>
            <CardFooter>
                 <Skeleton className="h-4 w-24" />
            </CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <>
      <Card className="shadow-lg h-full flex flex-col border-0 sm:border bg-transparent sm:bg-card">
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
        <CardContent className="flex-1 flex flex-col p-0 sm:p-6 sm:pt-0 overflow-y-auto">
          {selectedIds.length > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-md flex flex-col sm:flex-row items-center justify-between gap-2">
                 <div className="flex items-center gap-2">
                    <Checkbox
                        id="select-all-bulk"
                        checked={filteredAndSortedPasswords.length > 0 && selectedIds.length === filteredAndSortedPasswords.length}
                        onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                        aria-label="Select all"
                    />
                    <label htmlFor="select-all-bulk" className="text-sm font-medium">{selectedIds.length} of {filteredAndSortedPasswords.length} selected</label>
                 </div>
                <BulkActions />
            </div>
          )}
          {isLoadingPasswords ? renderSkeleton() : (
            <div className="flex-1 pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredAndSortedPasswords.map((entry) => (
                    <Card 
                      key={entry.id} 
                      className={cn("flex flex-col transition-all", selectedIds.includes(entry.id) && "border-primary ring-2 ring-primary")}
                    >
                        <CardHeader className="flex-row items-start justify-between gap-2 pb-4">
                           <div className="flex items-center gap-2 flex-1 min-w-0">
                             <div onClick={(e) => e.stopPropagation()}>
                               <Checkbox
                                  checked={selectedIds.includes(entry.id)}
                                  onCheckedChange={(checked) => handleSelect(entry.id, Boolean(checked))}
                                  aria-label={`Select ${entry.serviceName}`}
                              />
                             </div>
                             <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleOpenDetailView(entry)}>
                               <CardTitle className="text-lg truncate" title={entry.serviceName}>{entry.serviceName}</CardTitle>
                               {entry.tags && entry.tags.length > 0 && !isTrashView && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {entry.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                  ))}
                                </div>
                              )}
                             </div>
                           </div>
                           <div onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2">
                                          <MoreHorizontal />
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleOpenDetailView(entry)}>
                                          View Details
                                      </DropdownMenuItem>
                                      {!isTrashView && (
                                          <>
                                              <DropdownMenuItem onClick={() => handleOpenEditForm(entry)}>
                                                  <Pencil className="mr-2" /> Edit
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => handleToggleFavorite(entry.id, entry.isFavorite)}>
                                                  <Star className={cn("mr-2", entry.isFavorite ? "text-yellow-400 fill-yellow-400" : "")} /> 
                                                  {entry.isFavorite ? "Unfavorite" : "Favorite"}
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
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="space-y-1">
                               <Label className="flex items-center gap-2 text-muted-foreground"><UserIcon className="h-3.5 w-3.5"/> Username</Label>
                               <div className="flex items-center justify-between gap-2 bg-muted/50 p-2 rounded-md">
                                  <span className="font-mono text-sm flex-1 truncate max-w-xs" title={entry.username}>
                                    {entry.username}
                                  </span>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleCopy(entry.username, `${entry.id}-username`); }}>
                                    {copiedField === `${entry.id}-username` ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                               </div>
                           </div>
                           <div className="space-y-1">
                               <Label className="flex items-center gap-2 text-muted-foreground"><KeyRound className="h-3.5 w-3.5"/> Password</Label>
                                <div className="flex items-center justify-between gap-2 bg-muted/50 p-2 rounded-md">
                                   <span className="font-mono text-sm flex-1 truncate">
                                       {revealedPasswords[entry.id] ? getDecryptedPassword(entry) : "••••••••••••"}
                                   </span>
                                   <div className="flex items-center">
                                       <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); togglePasswordVisibility(entry.id); }}>
                                         {revealedPasswords[entry.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                       </Button>
                                       <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleCopy(getDecryptedPassword(entry), `${entry.id}-password`, true); }}>
                                           {copiedField === `${entry.id}-password` ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                                       </Button>
                                   </div>
                                </div>
                           </div>
                        </CardContent>
                        <CardFooter className="mt-auto pt-4">
                             {!isTrashView && <PasswordStrengthPill password={getDecryptedPassword(entry)} />}
                        </CardFooter>
                    </Card>
                  ))}
              </div>
            </div>
          )}
          {(!isLoadingPasswords && filteredAndSortedPasswords.length === 0) && (
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
        onOpenChange={(open) => !open && setViewingPasswordId(null)}
        onEdit={handleOpenEditForm}
        onDelete={(id) => handleDeleteRequest([id], isTrashView)}
        onToggleFavorite={(id, isFavorite) => handleToggleFavorite(id, isFavorite)}
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

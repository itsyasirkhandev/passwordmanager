"use client";

import { useState, useMemo, useEffect } from "react";
import { Eye, EyeOff, PlusCircle, ClipboardCopy, Check, Search, X, MoreHorizontal, Pencil, Trash2, ShieldQuestion, Undo, ShieldAlert, KeyRound } from "lucide-react";
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

const initialPasswords: PasswordEntry[] = [
  {
    id: "1",
    serviceName: "Google",
    url: "https://google.com",
    username: "user@gmail.com",
    password: "supersecretpassword1",
    notes: "Security question: Favorite color is blue.",
    folderId: "1",
  },
  {
    id: "2",
    serviceName: "Facebook",
    url: "https://facebook.com",
    username: "user.name",
    password: "anotherSecurePassword!",
    notes: "",
    folderId: "1",
  },
  {
    id: "3",
    serviceName: "GitHub",
    url: "https://github.com",
    username: "git-user",
    password: "my-repo-password-123",
    notes: "Used for work projects.",
    folderId: "2",
  },
  {
    id: "4",
    serviceName: "Bank of America",
    url: "https://bankofamerica.com",
    username: "bank.user",
    password: "very-secure-banking-password",
    notes: "",
    folderId: "3",
  },
];

type PasswordListProps = {
  selectedFolderId: string | null;
  folders: Folder[];
};

export default function PasswordList({ selectedFolderId, folders }: PasswordListProps) {
  const [passwords, setPasswords] = useState<PasswordEntry[]>(initialPasswords);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ ids: string[], permanent: boolean } | null>(null);
  const { toast } = useToast();

  const isTrashView = selectedFolderId === 'trash';

  const filteredPasswords = useMemo(() => {
    let filtered = isTrashView
      ? passwords.filter(p => p.deletedAt)
      : passwords.filter(p => !p.deletedAt);

    if (selectedFolderId && selectedFolderId !== 'trash') {
      filtered = filtered.filter(p => p.folderId === selectedFolderId);
    }
    
    if (!searchQuery) {
      return filtered;
    }
    
    const lowercasedQuery = searchQuery.toLowerCase();
    return filtered.filter(
      (p) =>
        p.serviceName.toLowerCase().includes(lowercasedQuery) ||
        p.username.toLowerCase().includes(lowercasedQuery) ||
        p.url?.toLowerCase().includes(lowercasedQuery) ||
        p.notes?.toLowerCase().includes(lowercasedQuery)
    );
  }, [passwords, searchQuery, selectedFolderId, isTrashView]);

  useEffect(() => {
    setSelectedIds([]);
  }, [selectedFolderId, searchQuery]);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedField(fieldId);
        toast({ title: "Copied to clipboard!" });
        setTimeout(() => setCopiedField(null), 2000);
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
  }
  
  const handleSubmitPassword = (data: PasswordFormValues) => {
    if (editingPassword) {
      setPasswords(passwords.map(p => p.id === editingPassword.id ? { ...p, ...data } : p));
      toast({ title: "Success", description: "Password updated." });
    } else {
      const newPassword: PasswordEntry = { ...data, id: String(Date.now()) };
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
      setSelectedIds(filteredPasswords.map(p => p.id));
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
        setPasswords(prev => prev.map(p => ids.includes(p.id) ? { ...p, deletedAt: new Date() } : p));
        toast({ title: `${ids.length} item(s) moved to trash.` });
    }
    
    setSelectedIds([]);
    setDeleteConfirmation(null);
  };

  const handleRestore = (ids: string[]) => {
    setPasswords(prev => prev.map(p => ids.includes(p.id) ? { ...p, deletedAt: undefined } : p));
    toast({ title: `${ids.length} item(s) restored.` });
    setSelectedIds([]);
  }

  const BulkActions = () => {
      if(selectedIds.length === 0) return null;

      if(isTrashView) {
          return (
              <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleRestore(selectedIds)}>
                      <Undo className="mr-2" /> Restore ({selectedIds.length})
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteRequest(selectedIds, true)}>
                      <Trash2 className="mr-2" /> Delete Permanently ({selectedIds.length})
                  </Button>
              </div>
          )
      }

      return (
        <Button variant="destructive" size="sm" onClick={() => handleDeleteRequest(selectedIds)}>
          <Trash2 className="mr-2" /> Move to Trash ({selectedIds.length})
        </Button>
      )
  };

  const currentFolder = folders.find(f => f.id === selectedFolderId);
  const folderTitle = isTrashView ? "Trash" : (currentFolder ? currentFolder.name : "All Passwords");

  return (
    <>
      <Card className="shadow-lg h-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
                <CardTitle>{folderTitle}</CardTitle>
                {isTrashView && <p className="text-sm text-muted-foreground mt-1">Items in the trash will be permanently deleted after 30 days.</p>}
            </div>
            <div className="flex w-full sm:w-auto items-center gap-2">
                <div className="relative w-full sm:w-64">
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
                {!isTrashView && (
                    <Button onClick={handleOpenAddForm} className="whitespace-nowrap">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Password
                    </Button>
                )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedIds.length > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-md flex items-center justify-between">
                <p className="text-sm font-medium">{selectedIds.length} of {filteredPasswords.length} selected</p>
                <BulkActions />
            </div>
          )}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                     <Checkbox
                        checked={selectedIds.length > 0 && selectedIds.length === filteredPasswords.length}
                        onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                        aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="w-[25%]">Service</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPasswords.map((entry) => (
                  <TableRow key={entry.id} data-state={selectedIds.includes(entry.id) && "selected"}>
                    <TableCell>
                         <Checkbox
                            checked={selectedIds.includes(entry.id)}
                            onCheckedChange={(checked) => handleSelect(entry.id, Boolean(checked))}
                            aria-label={`Select ${entry.serviceName}`}
                        />
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.serviceName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono flex-1 truncate">
                          {entry.username}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(entry.username, `${entry.id}-username`)}
                          aria-label="Copy username"
                        >
                          {copiedField === `${entry.id}-username` ? <Check className="h-4 w-4 text-primary" /> : <ClipboardCopy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono flex-1">
                          {revealedPasswords[entry.id] ? entry.password : "••••••••••••"}
                        </span>
                        <div className="flex items-center">
                          <Button variant="ghost" size="icon" onClick={() => togglePasswordVisibility(entry.id)} aria-label={revealedPasswords[entry.id] ? "Hide password" : "Show password"}>
                            {revealedPasswords[entry.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                           <Button variant="ghost" size="icon" onClick={() => handleCopy(entry.password, `${entry.id}-password`)} aria-label="Copy password">
                             {copiedField === `${entry.id}-password` ? <Check className="h-4 w-4 text-primary" /> : <ClipboardCopy className="h-4 w-4" />}
                           </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
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
                                            <Pencil className="mr-2"/> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleCopy(entry.username, `${entry.id}-username`)}>
                                            <ClipboardCopy className="mr-2"/> Copy Username
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleCopy(entry.password, `${entry.id}-password`)}>
                                            <KeyRound className="mr-2"/> Copy Password
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteRequest([entry.id])}>
                                            <Trash2 className="mr-2"/> Move to Trash
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {isTrashView && (
                                    <>
                                        <DropdownMenuItem onClick={() => handleRestore([entry.id])}>
                                            <Undo className="mr-2"/> Restore
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteRequest([entry.id], true)}>
                                            <ShieldAlert className="mr-2"/> Delete Permanently
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
          {(filteredPasswords.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? (
                <>
                  <p>No results found for "{searchQuery}".</p>
                  <p>Try searching for something else.</p>
                </>
              ) : (
                <>
                  <p>{isTrashView ? "Trash is empty." : "Your vault is empty for this folder."}</p>
                  {!isTrashView && <p>Click "Add Password" to get started.</p>}
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
    </>
  );
}

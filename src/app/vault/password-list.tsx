"use client";

import { useState, useMemo } from "react";
import { Eye, EyeOff, PlusCircle, ClipboardCopy, Check, Search, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordFormDialog, type PasswordEntry, type PasswordFormValues } from "./password-form-dialog";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

const initialPasswords: PasswordEntry[] = [
  {
    id: "1",
    serviceName: "Google",
    url: "https://google.com",
    username: "user@gmail.com",
    password: "supersecretpassword1",
    notes: "Security question: Favorite color is blue.",
  },
  {
    id: "2",
    serviceName: "Facebook",
    url: "https://facebook.com",
    username: "user.name",
    password: "anotherSecurePassword!",
    notes: "",
  },
  {
    id: "3",
    serviceName: "GitHub",
    url: "https://github.com",
    username: "git-user",
    password: "my-repo-password-123",
    notes: "Used for work projects.",
  },
];

export default function PasswordList() {
  const [passwords, setPasswords] = useState<PasswordEntry[]>(initialPasswords);
  const [revealedPasswords, setRevealedPasswords] = useState<
    Record<string, boolean>
  >({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const filteredPasswords = useMemo(() => {
    if (!searchQuery) {
      return passwords;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return passwords.filter(
      (p) =>
        p.serviceName.toLowerCase().includes(lowercasedQuery) ||
        p.username.toLowerCase().includes(lowercasedQuery) ||
        p.url?.toLowerCase().includes(lowercasedQuery) ||
        p.notes?.toLowerCase().includes(lowercasedQuery)
    );
  }, [passwords, searchQuery]);


  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedField(fieldId);
        toast({
            title: "Copied to clipboard!",
        });
        setTimeout(() => {
          setCopiedField(null);
        }, 2000);
      },
      (err) => {
        console.error("Could not copy text: ", err);
        toast({
          variant: "destructive",
          title: "Failed to copy",
          description: "Could not copy to clipboard.",
        });
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
      // Update existing password
      setPasswords(passwords.map(p => p.id === editingPassword.id ? { ...p, ...data } : p));
      toast({ title: "Success", description: "Password updated." });
    } else {
      // Add new password
      const newPassword: PasswordEntry = { ...data, id: String(Date.now()) };
      setPasswords([...passwords, newPassword]);
      toast({ title: "Success", description: "Password added to your vault." });
    }
    setIsFormOpen(false);
    setEditingPassword(null);
  };


  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle>Your Vault</CardTitle>
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
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={() => setSearchQuery("")}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <Button onClick={handleOpenAddForm} className="whitespace-nowrap">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Password
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[25%]">Service</TableHead>
                  <TableHead className="w-[37.5%]">Username</TableHead>
                  <TableHead className="w-[37.5%]">Password</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPasswords.map((entry) => (
                  <TableRow key={entry.id} onClick={() => handleOpenEditForm(entry)} className="cursor-pointer">
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
                          onClick={(e) => { e.stopPropagation(); handleCopy(entry.username, `${entry.id}-username`); }}
                          aria-label="Copy username"
                        >
                          {copiedField === `${entry.id}-username` ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <ClipboardCopy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono flex-1">
                          {revealedPasswords[entry.id]
                            ? entry.password
                            : "••••••••••••"}
                        </span>
                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => togglePasswordVisibility(entry.id)}
                            aria-label={
                              revealedPasswords[entry.id]
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {revealedPasswords[entry.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                           <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopy(entry.password, `${entry.id}-password`)}
                            aria-label="Copy password"
                          >
                            {copiedField === `${entry.id}-password` ? (
                              <Check className="h-4 w-4 text-primary" />
                            ) : (
                              <ClipboardCopy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {passwords.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Your vault is empty.</p>
              <p>Click "Add Password" to get started.</p>
            </div>
          )}
          {passwords.length > 0 && filteredPasswords.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
                <p>No results found for "{searchQuery}".</p>
                <p>Try searching for something else.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <PasswordFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmitPassword}
        initialData={editingPassword}
      />
    </>
  );
}

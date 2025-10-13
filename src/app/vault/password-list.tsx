"use client";

import { useState } from "react";
import { Eye, EyeOff, PlusCircle } from "lucide-react";
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
import { AddPasswordDialog, type PasswordEntry } from "./add-password-dialog";

const initialPasswords: PasswordEntry[] = [
  {
    id: "1",
    website: "Google",
    username: "user@gmail.com",
    password: "supersecretpassword1",
  },
  {
    id: "2",
    website: "Facebook",
    username: "user.name",
    password: "anotherSecurePassword!",
  },
  {
    id: "3",
    website: "GitHub",
    username: "git-user",
    password: "my-repo-password-123",
  },
];

export default function PasswordList() {
  const [passwords, setPasswords] = useState<PasswordEntry[]>(initialPasswords);
  const [revealedPasswords, setRevealedPasswords] = useState<
    Record<string, boolean>
  >({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const togglePasswordVisibility = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  
  const handleAddPassword = (newPassword: Omit<PasswordEntry, 'id'>) => {
    setPasswords(prev => [...prev, { ...newPassword, id: String(Date.now()) }]);
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Vault</CardTitle>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Password
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Website/Service</TableHead>
                  <TableHead className="w-1/3">Username</TableHead>
                  <TableHead className="w-1/3">Password</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {passwords.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.website}</TableCell>
                    <TableCell>{entry.username}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono flex-1">
                          {revealedPasswords[entry.id]
                            ? entry.password
                            : "••••••••••••"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePasswordVisibility(entry.id)}
                          aria-label={revealedPasswords[entry.id] ? "Hide password" : "Show password"}
                        >
                          {revealedPasswords[entry.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
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
        </CardContent>
      </Card>
      <AddPasswordDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddPassword={handleAddPassword}
      />
    </>
  );
}

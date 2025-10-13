
"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as CryptoJS from 'crypto-js';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, Download } from "lucide-react";
import { type PasswordEntry } from "./password-list";
import { type Folder } from "@/components/folder-sidebar";
import { useToast } from "@/hooks/use-toast";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const exportSchema = z.object({
  format: z.enum(["csv", "json"]),
  scope: z.enum(["all", "current", "selected"]),
  password: z.string().min(8, "Encryption password must be at least 8 characters long."),
});

type ExportFormValues = z.infer<typeof exportSchema>;

type ExportDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  allPasswords: PasswordEntry[];
  filteredPasswords: PasswordEntry[];
  selectedIds: string[];
  folders: Folder[];
  currentFolderId: string | null;
  currentTag: string | null;
  isTrashView: boolean;
};

export function ExportDialog({
  isOpen,
  onOpenChange,
  allPasswords,
  filteredPasswords,
  selectedIds,
  folders,
}: ExportDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<ExportFormValues>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      format: "json",
      scope: selectedIds.length > 0 ? "selected" : "current",
      password: "",
    },
  });

  const getPasswordsToExport = (scope: 'all' | 'current' | 'selected'): PasswordEntry[] => {
    switch (scope) {
      case "selected":
        return allPasswords.filter(p => selectedIds.includes(p.id));
      case "current":
        return filteredPasswords;
      case "all":
      default:
        return allPasswords.filter(p => !p.deletedAt);
    }
  };

  const convertToCSV = (data: PasswordEntry[]) => {
    const folderMap = new Map(folders.map(f => [f.id, f.name]));
    const headers = "serviceName,url,username,password,notes,folder,tags,isFavorite,createdAt,updatedAt";
    const rows = data.map(p => {
      const folderName = p.folderId ? folderMap.get(p.folderId) || "" : "";
      const values = [
        p.serviceName,
        p.url,
        p.username,
        p.password,
        p.notes,
        folderName,
        p.tags?.join('|'),
        p.isFavorite,
        p.createdAt.toISOString(),
        p.updatedAt.toISOString(),
      ];
      return values.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
    });
    return [headers, ...rows].join('\n');
  };

  const handleExport = (values: ExportFormValues) => {
    setIsLoading(true);
    try {
      const passwordsToExport = getPasswordsToExport(values.scope);
      
      if (passwordsToExport.length === 0) {
        toast({
            variant: 'destructive',
            title: 'Nothing to Export',
            description: 'The selected scope contains no passwords.'
        });
        return;
      }

      let fileContent: string;
      if (values.format === "csv") {
        fileContent = convertToCSV(passwordsToExport);
      } else {
        fileContent = JSON.stringify(passwordsToExport, null, 2);
      }

      const encryptedContent = CryptoJS.AES.encrypt(fileContent, values.password).toString();

      const blob = new Blob([encryptedContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `cipher-vault-export-${date}.${values.format}.enc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
          title: 'Export Successful',
          description: 'Your encrypted vault data has been downloaded.',
      });

      onOpenChange(false);
      form.reset();

    } catch (error) {
        console.error("Export failed:", error);
        toast({
            variant: 'destructive',
            title: 'Export Failed',
            description: 'An unexpected error occurred during the export process.'
        })
    } finally {
        setIsLoading(false);
    }
  };
  
  const scope = form.watch('scope');
  const itemsInScope = getPasswordsToExport(scope).length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Vault</DialogTitle>
          <DialogDescription>
            Download your password vault as an encrypted file.
          </DialogDescription>
        </DialogHeader>
        <VisuallyHidden>
            <DialogTitle>Export Vault</DialogTitle>
        </VisuallyHidden>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleExport)} className="space-y-4">
            <FormField
              control={form.control}
              name="scope"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Export Scope</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="all" />
                        </FormControl>
                        <FormLabel className="font-normal">Entire Vault ({getPasswordsToExport('all').length} items)</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="current" />
                        </FormControl>
                        <FormLabel className="font-normal">Current View ({getPasswordsToExport('current').length} items)</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="selected" disabled={selectedIds.length === 0} />
                        </FormControl>
                        <FormLabel className="font-normal disabled:opacity-50">Selected Items ({selectedIds.length} items)</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Export Format</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="json" />
                        </FormControl>
                        <FormLabel className="font-normal">JSON</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="csv" />
                        </FormControl>
                        <FormLabel className="font-normal">CSV</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Encryption Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter a strong password" {...field} />
                  </FormControl>
                  <FormDescription>
                    This password will be required to decrypt your data. Do not lose it.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Alert variant="destructive" className="mt-4">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Security Warning</AlertTitle>
              <AlertDescription>
                The exported file contains sensitive data. Store it securely and do not share the file or your encryption password.
              </AlertDescription>
            </Alert>
            
            <DialogFooter>
               <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
              <Button type="submit" disabled={isLoading || itemsInScope === 0}>
                {isLoading ? "Exporting..." : `Export ${itemsInScope} Items`}
                <Download className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

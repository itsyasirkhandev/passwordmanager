
"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useVault } from "@/context/vault-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PasswordGenerator } from "@/components/password-generator";
import { KeyRound, Loader } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Folder } from "@/components/folder-sidebar";
import { TagInput } from "@/components/tag-input";
import { PasswordStrengthIndicator } from "@/components/password-strength-indicator";
import { Timestamp } from "firebase/firestore";
import { type PasswordHistoryEntry } from "@/lib/password-history";
import { NotesTemplateDialog } from "@/components/notes-template-dialog";

const passwordSchema = z.object({
  serviceName: z.string().min(1, "Service name is required."),
  url: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  username: z.string().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
  notes: z.string().optional(),
  folderId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isFavorite: z.boolean().optional(),
});

export type PasswordEntry = z.infer<typeof passwordSchema> & {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp | null;
  userId?: string;
  passwordHistory?: PasswordHistoryEntry[];
};
export type PasswordFormValues = z.infer<typeof passwordSchema>;

type PasswordFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: PasswordFormValues) => Promise<void>;
  initialData?: PasswordEntry | null;
  folders: Folder[];
  defaultFolderId?: string | null;
};

export function PasswordFormDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
  folders,
  defaultFolderId
}: PasswordFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const { getDuplicatePasswordCount, getPasswordsUsingPassword } = useVault();
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      serviceName: "",
      url: "",
      username: "",
      password: "",
      notes: "",
      folderId: undefined,
      tags: [],
      isFavorite: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset(initialData);
      } else {
        // Smart default for folderId
        const validDefaultFolder = defaultFolderId && defaultFolderId !== 'trash' && defaultFolderId !== 'favorites';
        const firstAvailableFolder = folders && folders.length > 0 ? folders[0].id : undefined;
        
        form.reset({
          serviceName: "",
          url: "",
          username: "",
          password: "",
          notes: "",
          folderId: validDefaultFolder ? defaultFolderId : firstAvailableFolder,
          tags: [],
          isFavorite: false,
        });
      }
    }
  }, [isOpen, initialData, form, defaultFolderId, folders]);

  const handleFormSubmit = async (values: PasswordFormValues) => {
    setIsSubmitting(true);
    await onSubmit(values);
    setIsSubmitting(false);
    onOpenChange(false);
  };
  
  const isEditing = !!initialData;

  const handleUsePassword = (password: string) => {
    form.setValue("password", password, { shouldValidate: true });
  };

  const passwordValue = form.watch("password");
  const duplicateCount = passwordValue ? getDuplicatePasswordCount(passwordValue, initialData?.id) : 0;
  const duplicateEntries = passwordValue && duplicateCount > 0 ? getPasswordsUsingPassword(passwordValue, initialData?.id) : [];

  const handleSelectTemplate = (template: string) => {
    const currentNotes = form.getValues("notes") || "";
    const newNotes = currentNotes ? `${currentNotes}\n\n${template}` : template;
    form.setValue("notes", newNotes);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md grid-rows-[auto_1fr_auto] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Password" : "Add New Password"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for this password entry."
              : "Enter the details for the new password entry."}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto pr-6 -mr-6 pl-1 -ml-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 px-5">
            <FormField
              control={form.control}
              name="serviceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Google" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., https://www.google.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username / Email</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., user@example.com" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input type="password" placeholder="••••••••••••" {...field} />
                    </FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" type="button" aria-label="Open password generator">
                           <KeyRound />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                         <PasswordGenerator onUsePassword={handleUsePassword} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <FormMessage />
                  <PasswordStrengthIndicator password={passwordValue} />
                  {duplicateCount > 0 && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This password is already used for {duplicateCount} other {duplicateCount === 1 ? 'account' : 'accounts'}:
                        <ul className="list-disc pl-5 mt-1">
                          {duplicateEntries.slice(0, 3).map(entry => (
                            <li key={entry.id} className="text-xs">{entry.serviceName}</li>
                          ))}
                          {duplicateEntries.length > 3 && <li className="text-xs">and {duplicateEntries.length - 3} more...</li>}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="folderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a folder" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {folders && folders.map(folder => (
                                <SelectItem key={folder.id} value={folder.id}>
                                    {folder.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagInput
                      placeholder="Enter a tag..."
                      tags={field.value || []}
                      setTags={(newTags) => {
                        form.setValue("tags", newTags);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Notes</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsTemplateDialogOpen(true)}
                      className="h-auto p-1 text-xs"
                    >
                      Use Template
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Security questions, recovery codes..."
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4 gap-2 sm:gap-0">
               <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader className="mr-2 animate-spin" />}
                {isEditing ? "Save Changes" : "Save Password"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </div>
      </DialogContent>
      <NotesTemplateDialog
        isOpen={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        onSelectTemplate={handleSelectTemplate}
      />
    </Dialog>
  );
}

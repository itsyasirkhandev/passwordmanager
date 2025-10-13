"use client";

import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PasswordGenerator } from "@/components/password-generator";
import { KeyRound } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Folder } from "@/components/folder-sidebar";


const passwordSchema = z.object({
  serviceName: z.string().min(1, "Service name is required."),
  url: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  username: z.string().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
  notes: z.string().optional(),
  folderId: z.string().optional(),
});

export type PasswordEntry = z.infer<typeof passwordSchema> & { id: string };
export type PasswordFormValues = z.infer<typeof passwordSchema>;

type PasswordFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: PasswordFormValues) => void;
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
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      serviceName: "",
      url: "",
      username: "",
      password: "",
      notes: "",
      folderId: defaultFolderId ?? undefined,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset({
        serviceName: "",
        url: "",
        username: "",
        password: "",
        notes: "",
        folderId: defaultFolderId ?? folders[0]?.id ?? undefined,
      });
    }
  }, [initialData, form, defaultFolderId, folders]);

  const handleFormSubmit = (values: PasswordFormValues) => {
    onSubmit(values);
    form.reset();
    onOpenChange(false);
  };
  
  const isEditing = !!initialData;

  const handleUsePassword = (password: string) => {
    form.setValue("password", password, { shouldValidate: true });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Password" : "Add New Password"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for this password entry."
              : "Enter the details for the new password entry."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
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
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="folderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a folder" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {folders.map(folder => (
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Security questions, recovery codes..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
               <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{isEditing ? "Save Changes" : "Save Password"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

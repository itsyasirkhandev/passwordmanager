"use client";

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

const passwordSchema = z.object({
  website: z.string().min(1, "Website name is required."),
  username: z.string().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
});

export type PasswordEntry = z.infer<typeof passwordSchema> & { id: string };

type AddPasswordDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddPassword: (data: Omit<PasswordEntry, 'id'>) => void;
};

export function AddPasswordDialog({
  isOpen,
  onOpenChange,
  onAddPassword,
}: AddPasswordDialogProps) {
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      website: "",
      username: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof passwordSchema>) {
    onAddPassword(values);
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Password</DialogTitle>
          <DialogDescription>
            Enter the details for the new password entry.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website / Service</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Google" {...field} />
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
                  <FormControl>
                    <Input type="password" placeholder="••••••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save Password</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

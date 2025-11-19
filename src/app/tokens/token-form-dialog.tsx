
"use client";

import { useEffect, useState } from "react";
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
import { Loader } from "lucide-react";
import type { TokenEntry } from "@/context/token-context";

const tokenSchema = z.object({
  name: z.string().min(1, "Token name is required."),
  value: z.string().min(1, "Token value is required."),
});

export type TokenFormValues = z.infer<typeof tokenSchema>;

type TokenFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: TokenFormValues) => Promise<void>;
  initialData?: TokenEntry | null;
};

export function TokenFormDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
}: TokenFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<TokenFormValues>({
    resolver: zodResolver(tokenSchema),
    defaultValues: {
      name: "",
      value: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          value: "" // Do not expose encrypted value in form
        });
      } else {
        form.reset({
          name: "",
          value: "",
        });
      }
    }
  }, [isOpen, initialData, form]);

  const handleFormSubmit = async (values: TokenFormValues) => {
    setIsSubmitting(true);
    await onSubmit(values);
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const isEditing = !!initialData;
  const valuePlaceholder = isEditing ? "Enter new value to update" : "Enter token value";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Token" : "Add New Token"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for this token."
              : "Enter the details for the new API token or secret."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., OpenAI API Key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Value</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={valuePlaceholder} {...field} />
                  </FormControl>
                   <FormDescription>
                    {isEditing ? "Leave blank to keep the current value." : "Your token will be stored encrypted."}
                    </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader className="mr-2 animate-spin" />}
                {isEditing ? "Save Changes" : "Save Token"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

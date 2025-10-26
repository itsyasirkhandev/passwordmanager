
"use client";

import { useState } from "react";
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
import { Loader, KeyRound, Copy, Eye, EyeOff, User } from "lucide-react";
import { PasswordGenerator } from "@/components/password-generator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { type PasswordEntry } from "@/app/vault/password-form-dialog";

const accountSchema = z.object({
  username: z.string().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
});

type AccountFormValues = z.infer<typeof accountSchema>;

type AddAccountDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: AccountFormValues) => Promise<void>;
  providerName: string;
};

export function AddAccountDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  providerName,
}: AddAccountDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { username: "", password: "" },
  });

  const handleFormSubmit = async (values: AccountFormValues) => {
    setIsSubmitting(true);
    await onSubmit(values);
    setIsSubmitting(false);
    onOpenChange(false);
    form.reset();
  };
  
  const handleUsePassword = (password: string) => {
    form.setValue("password", password, { shouldValidate: true });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Account to {providerName}</DialogTitle>
          <DialogDescription>
            Enter the credentials for this new account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader className="mr-2 animate-spin" />}
                Save Account
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


type ViewAccountDialogProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    account: PasswordEntry | null;
    getDecryptedPassword: (entry: PasswordEntry) => string;
};


export function ViewAccountDialog({ isOpen, onOpenChange, account, getDecryptedPassword }: ViewAccountDialogProps) {
    const { toast } = useToast();
    const [isPasswordRevealed, setIsPasswordRevealed] = useState(false);
    
    if (!account) return null;

    const decryptedPassword = getDecryptedPassword(account);
    
    const handleCopy = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: `Copied ${fieldName} to clipboard!` });
        }, (err) => {
            toast({ variant: "destructive", title: "Failed to copy" });
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            onOpenChange(open);
            if (!open) setIsPasswordRevealed(false);
        }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{account.serviceName}</DialogTitle>
                    <DialogDescription>
                        View your credentials for this account.
                    </DialogDescription>
                </DialogHeader>
                 <div className="space-y-4 py-4">
                    <div className="flex flex-col gap-1">
                        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" /> Username/Email
                        </div>
                        <div className="flex items-center justify-between">
                        <span className="font-mono text-sm break-all">
                            {account.username}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopy(account.username, "username")}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <KeyRound className="h-4 w-4" /> Password
                        </div>
                        <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">
                            {isPasswordRevealed ? decryptedPassword : "••••••••••••"}
                        </span>
                        <div className="flex items-center">
                            <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsPasswordRevealed(!isPasswordRevealed)}
                            >
                            {isPasswordRevealed ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                            </Button>
                            <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopy(decryptedPassword, "password")}
                            >
                            <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

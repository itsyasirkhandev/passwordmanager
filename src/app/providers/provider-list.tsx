
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Loader, Globe, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useVault } from '@/context/vault-context';
import { Skeleton } from '@/components/ui/skeleton';
import { type PasswordEntry } from '@/app/vault/password-form-dialog';
import { AddAccountDialog, ViewAccountDialog } from './account-dialogs';


export type Provider = {
  id: string;
  name: string;
  url: string;
  userId: string;
};

const providerSchema = z.object({
  name: z.string().min(1, 'Provider name is required.'),
  url: z.string().url('Please enter a valid URL.'),
});

type ProviderFormValues = z.infer<typeof providerSchema>;

export default function ProviderList() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { passwords, folders, addOrUpdatePassword, getDecryptedPassword } = useVault();
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);
  const [isViewAccountDialogOpen, setIsViewAccountDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<PasswordEntry | null>(null);

  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);


  const providersCol = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'users', user.uid, 'providers');
  }, [firestore, user]);

  const { data: providers, isLoading: isLoadingProviders } = useCollection<Provider>(providersCol);

  const providerForm = useForm<ProviderFormValues>({
    resolver: zodResolver(providerSchema),
    defaultValues: { name: '', url: '' },
  });

  useEffect(() => {
    if (isProviderDialogOpen) {
      if (editingProvider) {
        providerForm.reset(editingProvider);
      } else {
        providerForm.reset({ name: '', url: '' });
      }
    }
  }, [isProviderDialogOpen, editingProvider, providerForm]);

  const handleOpenAddForm = () => {
    setEditingProvider(null);
    setIsProviderDialogOpen(true);
  };

  const handleOpenEditForm = (provider: Provider) => {
    setEditingProvider(provider);
    setIsProviderDialogOpen(true);
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteConfirmation(id);
  };

  const handleProviderSubmit = async (values: ProviderFormValues) => {
    if (!user || !providersCol) return;
    setIsSubmitting(true);
    
    try {
      if (editingProvider) {
        // Update existing provider
        const docRef = doc(firestore, 'users', user.uid, 'providers', editingProvider.id);
        await updateDoc(docRef, values);
        toast({ title: 'Success', description: 'Provider updated successfully.' });
      } else {
        // Add new provider
        const newProviderRef = doc(providersCol);
        const newProvider = { ...values, userId: user.uid, id: newProviderRef.id };
        await setDoc(newProviderRef, newProvider);
        toast({ title: 'Success', description: 'Provider added successfully.' });
      }
      setIsProviderDialogOpen(false);
      setEditingProvider(null);
    } catch (error) {
      console.error('Error saving provider:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save provider.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation || !user) return;
    const docRef = doc(firestore, 'users', user.uid, 'providers', deleteConfirmation);
    try {
      await deleteDoc(docRef);
      toast({ title: 'Success', description: 'Provider deleted.' });
      setDeleteConfirmation(null);
    } catch(error) {
        console.error('Error deleting provider:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete provider.' });
    }
  };
  
  const handleOpenAddAccountForm = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsAddAccountDialogOpen(true);
  };
  
  const handleOpenViewAccountDialog = (account: PasswordEntry) => {
    setSelectedAccount(account);
    setIsViewAccountDialogOpen(true);
  };

  const handleSubmitAccount = async (data: { username: string; password: string }) => {
    if (!selectedProvider) return;
    
    const providerAccounts = passwords.filter(p => p.url === selectedProvider.url);
    const serviceName = `${selectedProvider.name} Account ${providerAccounts.length + 1}`;

    const accountData = {
        ...data,
        serviceName,
        url: selectedProvider.url,
        folderId: folders?.[0]?.id // Default to the first folder
    };

    await addOrUpdatePassword(accountData);
  };

  const providersWithAccounts = useMemo(() => {
    if (!providers || !passwords) return [];
    return providers.map(provider => ({
      ...provider,
      accounts: passwords.filter(p => p.url === provider.url && !p.deletedAt),
    })).sort((a,b) => a.name.localeCompare(b.name));
  }, [providers, passwords]);

  if (isLoadingProviders) {
      return (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                      <CardHeader>
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                      </CardHeader>
                      <CardContent>
                          <Skeleton className="h-5 w-24" />
                      </CardContent>
                      <CardFooter>
                         <Skeleton className="h-10 w-full" />
                      </CardFooter>
                  </Card>
              ))}
          </div>
      )
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Providers</h1>
             <Dialog open={isProviderDialogOpen} onOpenChange={setIsProviderDialogOpen}>
                <DialogTrigger asChild>
                    <Button onClick={handleOpenAddForm}>
                      <PlusCircle className="mr-2" /> Add Provider
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>{editingProvider ? 'Edit Provider' : 'Add New Provider'}</DialogTitle>
                    <DialogDescription>
                        {editingProvider ? 'Update the details for this provider.' : 'Enter the details for a new service provider.'}
                    </DialogDescription>
                    </DialogHeader>
                    <Form {...providerForm}>
                    <form onSubmit={providerForm.handleSubmit(handleProviderSubmit)} className="space-y-4">
                        <FormField
                        control={providerForm.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Provider Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Google" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={providerForm.control}
                        name="url"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Provider Website URL</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., https://www.google.com" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsProviderDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader className="mr-2 animate-spin" />}
                            {editingProvider ? 'Save Changes' : 'Save Provider'}
                        </Button>
                        </DialogFooter>
                    </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
      
      {providersWithAccounts.length === 0 && !isLoadingProviders ? (
          <div className="text-center py-12 text-muted-foreground flex-1 flex flex-col justify-center items-center border-dashed border-2 rounded-lg">
              <p className="font-semibold text-lg">No Providers Yet</p>
              <p>Click "Add Provider" to get started.</p>
          </div>
      ) : (
        <Accordion type="multiple" className="w-full space-y-4">
          {providersWithAccounts.map((provider) => (
            <AccordionItem value={provider.id} key={provider.id} className="border rounded-lg bg-card">
              <div className="flex items-center p-4">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold flex items-center">
                    {provider.name}
                  </h2>
                  <a
                    href={provider.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Globe className="h-3 w-3" />
                    <span className="truncate max-w-[250px] sm:max-w-[350px]">
                      {provider.url.length > 50 ? `${provider.url.slice(0, 50)}...` : provider.url}
                    </span>
                  </a>
                </div>
                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEditForm(provider)}>
                              <Pencil className="mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteRequest(provider.id)}>
                              <Trash2 className="mr-2" /> Delete
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <AccordionTrigger className="p-2 hover:no-underline" />
                </div>
              </div>
              <AccordionContent className="p-4 pt-0">
                  <div className="space-y-2">
                    {provider.accounts.length > 0 ? provider.accounts.map(acc => (
                        <div key={acc.id} className="flex justify-between items-center p-3 rounded-md bg-muted/50 hover:bg-muted cursor-pointer" onClick={() => handleOpenViewAccountDialog(acc)}>
                            <div>
                                <p className="font-medium">{acc.serviceName}</p>
                                <p className="text-sm text-muted-foreground">{acc.username}</p>
                            </div>
                        </div>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No accounts added for this provider yet.</p>
                    )}
                  </div>
                  <Button className="mt-4 w-full" variant="outline" onClick={() => handleOpenAddAccountForm(provider)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Account
                 </Button>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
       <AddAccountDialog
        isOpen={isAddAccountDialogOpen}
        onOpenChange={setIsAddAccountDialogOpen}
        onSubmit={handleSubmitAccount}
        providerName={selectedProvider?.name || ''}
      />
      <ViewAccountDialog
        isOpen={isViewAccountDialogOpen}
        onOpenChange={setIsViewAccountDialogOpen}
        account={selectedAccount}
        getDecryptedPassword={getDecryptedPassword}
       />
        <AlertDialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this provider. Associated accounts will NOT be deleted.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmation(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className={buttonVariants({ variant: "destructive" })}>
                Delete Permanently
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

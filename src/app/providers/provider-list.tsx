
'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Loader, Globe } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useVault } from '@/context/vault-context';
import { Skeleton } from '@/components/ui/skeleton';
import { PasswordFormDialog, type PasswordEntry, type PasswordFormValues } from '@/app/vault/password-form-dialog';


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
  const { passwords, folders, addOrUpdatePassword } = useVault();
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const providersCol = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'users', user.uid, 'providers');
  }, [firestore, user]);

  const { data: providers, isLoading: isLoadingProviders } = useCollection<Provider>(providersCol);

  const providerForm = useForm<ProviderFormValues>({
    resolver: zodResolver(providerSchema),
    defaultValues: { name: '', url: '' },
  });

  const handleAddProvider = async (values: ProviderFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    const newProviderRef = doc(providersCol!);
    const newProvider = { ...values, userId: user.uid, id: newProviderRef.id };
    try {
      await setDoc(newProviderRef, newProvider);
      toast({ title: 'Success', description: 'Provider added successfully.' });
      setIsProviderDialogOpen(false);
      providerForm.reset();
    } catch (error) {
      console.error('Error adding provider:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add provider.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenAccountForm = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsAccountFormOpen(true);
  };

  const handleSubmitAccount = async (data: PasswordFormValues) => {
    if (!selectedProvider) return;
    
    const providerAccounts = passwords.filter(p => p.url === selectedProvider.url);
    const serviceName = `${selectedProvider.name} Account ${providerAccounts.length + 1}`;

    const accountData = {
        ...data,
        serviceName,
        url: selectedProvider.url,
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
                    <Button>
                    <PlusCircle className="mr-2" /> Add Provider
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>Add New Provider</DialogTitle>
                    <DialogDescription>
                        Enter the details for a new service provider.
                    </DialogDescription>
                    </DialogHeader>
                    <Form {...providerForm}>
                    <form onSubmit={providerForm.handleSubmit(handleAddProvider)} className="space-y-4">
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
                            Save Provider
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
              <AccordionTrigger className="p-4 hover:no-underline">
                  <div className="flex flex-col items-start text-left">
                      <h2 className="text-lg font-semibold">{provider.name}</h2>
                      <a href={provider.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <Globe className="h-3 w-3" />{provider.url}
                      </a>
                  </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 pt-0">
                  <div className="space-y-2">
                    {provider.accounts.length > 0 ? provider.accounts.map(acc => (
                        <div key={acc.id} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                            <div>
                                <p className="font-medium">{acc.serviceName}</p>
                                <p className="text-sm text-muted-foreground">{acc.username}</p>
                            </div>
                            {/* Further actions for each account can be added here */}
                        </div>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No accounts added for this provider yet.</p>
                    )}
                  </div>
                  <Button className="mt-4 w-full" variant="outline" onClick={() => handleOpenAccountForm(provider)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Account
                 </Button>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
       <PasswordFormDialog
        isOpen={isAccountFormOpen}
        onOpenChange={setIsAccountFormOpen}
        onSubmit={handleSubmitAccount}
        folders={folders}
        defaultFolderId={folders?.[0]?.id}
      />
    </div>
  );
}

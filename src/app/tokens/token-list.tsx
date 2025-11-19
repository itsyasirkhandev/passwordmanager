
'use client';

import { useState, useEffect } from 'react';
import { useTokens, type TokenEntry } from '@/context/token-context';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { PlusCircle, Loader, MoreHorizontal, Pencil, Trash2, Copy, Check, Eye, EyeOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Skeleton } from '@/components/ui/skeleton';
import { TokenFormDialog, type TokenFormValues } from './token-form-dialog';
import { useToast } from '@/hooks/use-toast';
import { buttonVariants } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

type TokenListProps = {
    isFormOpen?: boolean;
    onFormOpenChange?: (open: boolean) => void;
};

export default function TokenList({ isFormOpen, onFormOpenChange }: TokenListProps) {
  const { tokens, isLoadingTokens, addOrUpdateToken, deleteToken, getDecryptedToken } = useTokens();
  const { toast } = useToast();

  const [internalIsFormOpen, setInternalIsFormOpen] = useState(false);
  const [editingToken, setEditingToken] = useState<TokenEntry | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [revealedTokens, setRevealedTokens] = useState<Record<string, boolean>>({});
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const finalIsFormOpen = isFormOpen ?? internalIsFormOpen;
  const finalOnFormOpenChange = onFormOpenChange ?? setInternalIsFormOpen;

  useEffect(() => {
    if (isFormOpen) {
      handleOpenAddForm();
    }
  }, [isFormOpen]);

  const handleOpenAddForm = () => {
    setEditingToken(null);
    finalOnFormOpenChange(true);
  };

  const handleOpenEditForm = (token: TokenEntry) => {
    setEditingToken(token);
    finalOnFormOpenChange(true);
  };

  const handleSubmit = async (data: TokenFormValues) => {
    await addOrUpdateToken(data, editingToken?.id);
    finalOnFormOpenChange(false);
    setEditingToken(null);
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteConfirmation(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    await deleteToken(deleteConfirmation);
    setDeleteConfirmation(null);
  };

  const toggleTokenVisibility = (id: string) => {
    setRevealedTokens(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text: string, tokenId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedToken(tokenId);
      toast({ title: "Copied to clipboard!" });
      setTimeout(() => setCopiedToken(null), 2000);
      setTimeout(() => navigator.clipboard.writeText(""), 60000); // Clear after 1 minute
    });
  };
  
  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const jsDate = date.toDate ? date.toDate() : new Date(date);
    return formatDistanceToNow(jsDate, { addSuffix: true });
  };


  const renderSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-4 w-24" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">API Tokens</h1>
        <Button onClick={handleOpenAddForm}>
          <PlusCircle className="mr-2" /> Add Token
        </Button>
      </div>

      {isLoadingTokens ? renderSkeleton() : (
        tokens.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground flex-1 flex flex-col justify-center items-center border-dashed border-2 rounded-lg">
            <p className="font-semibold text-lg">No Tokens Saved Yet</p>
            <p>Click "Add Token" to store your first API key or secret.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tokens.map((token) => (
              <Card key={token.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="break-all">{token.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEditForm(token)}>
                          <Pencil className="mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteRequest(token.id)}>
                          <Trash2 className="mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-2 bg-muted/50 p-2 rounded-md">
                    <span className="font-mono text-sm flex-1 truncate">
                      {revealedTokens[token.id] ? getDecryptedToken(token) : '••••••••••••••••••••'}
                    </span>
                    <div className="flex items-center">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleTokenVisibility(token.id)}>
                        {revealedTokens[token.id] ? <EyeOff /> : <Eye />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(getDecryptedToken(token), token.id)}>
                        {copiedToken === token.id ? <Check className="text-primary" /> : <Copy />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                    <p className="text-xs text-muted-foreground">
                        Last updated {formatDate(token.updatedAt)}
                    </p>
                </CardFooter>
              </Card>
            ))}
          </div>
        )
      )}

      <TokenFormDialog
        isOpen={finalIsFormOpen}
        onOpenChange={finalOnFormOpenChange}
        onSubmit={handleSubmit}
        initialData={editingToken}
      />

      <AlertDialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this token.
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

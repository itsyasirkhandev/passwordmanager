"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PasswordStrengthIndicator } from "@/components/password-strength-indicator";
import {
  Pencil,
  Trash2,
  Star,
  ClipboardCopy,
  KeyRound,
  Globe,
  User,
  StickyNote,
  Calendar,
  Undo,
  ShieldAlert,
  Eye,
  EyeOff,
} from "lucide-react";
import { type PasswordEntry } from "./password-form-dialog";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { useState } from "react";

type PasswordDetailSheetProps = {
  entry: PasswordEntry | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (entry: PasswordEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCopy: (text: string, fieldId: string) => void;
  isTrashView: boolean;
  onRestore: (id: string) => void;
};

export function PasswordDetailSheet({
  entry,
  isOpen,
  onOpenChange,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopy,
  isTrashView,
  onRestore,
}: PasswordDetailSheetProps) {
  const [isPasswordRevealed, setIsPasswordRevealed] = useState(false);

  if (!entry) return null;

  const handleEdit = () => {
    onOpenChange(false);
    // Timeout to allow sheet to close before dialog opens
    setTimeout(() => onEdit(entry), 150);
  };

  const getPasswordAge = () => {
    return formatDistanceToNow(new Date(entry.updatedAt), { addSuffix: true });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="break-all">{entry.serviceName}</SheetTitle>
          {entry.url && (
            <SheetDescription className="flex items-center gap-2 pt-1">
              <Globe className="h-4 w-4" />
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate"
              >
                {entry.url}
              </a>
            </SheetDescription>
          )}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto pr-6 -mr-6 space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Login Details</h3>
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" /> Username/Email
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm break-all">
                    {entry.username}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onCopy(entry.username, `${entry.id}-detail-username`)}
                  >
                    <ClipboardCopy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <KeyRound className="h-4 w-4" /> Password
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">
                    {isPasswordRevealed ? entry.password : "••••••••••••"}
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
                      onClick={() => onCopy(entry.password, `${entry.id}-detail-password`)}
                    >
                      <ClipboardCopy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <PasswordStrengthIndicator password={entry.password} />
              </div>
            </div>
          </div>
          <Separator />
          {(entry.notes || (entry.tags && entry.tags.length > 0)) && (
            <>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Additional Information</h3>
                {entry.tags && entry.tags.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Tags</div>
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {entry.notes && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <StickyNote className="h-4 w-4" /> Notes
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words bg-muted/50 p-3 rounded-md">
                      {entry.notes}
                    </p>
                  </div>
                )}
              </div>
              <Separator />
            </>
          )}

          <div className="space-y-4">
             <h3 className="font-semibold text-lg">History</h3>
              <div className="space-y-3 text-sm">
                 <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Last updated: {getPasswordAge()}</span>
                 </div>
                 <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Modified: {format(new Date(entry.updatedAt), "PPP p")}</span>
                 </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Created: {format(new Date(entry.createdAt), "PPP p")}</span>
                 </div>
              </div>
          </div>
        </div>
        <SheetFooter className="pt-4 border-t">
          {isTrashView ? (
            <div className="w-full flex gap-2">
                <Button variant="outline" className="w-full" onClick={() => onRestore(entry.id)}>
                    <Undo className="mr-2 h-4 w-4" /> Restore
                </Button>
                <Button variant="destructive" className="w-full" onClick={() => onDelete(entry.id)}>
                    <ShieldAlert className="mr-2 h-4 w-4" /> Delete Permanently
                </Button>
            </div>
          ) : (
            <div className="w-full flex gap-2">
              <Button variant="secondary" onClick={handleEdit}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onToggleFavorite(entry.id)}
                aria-label={
                  entry.isFavorite ? "Remove from favorites" : "Add to favorites"
                }
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    entry.isFavorite
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-muted-foreground"
                  )}
                />
              </Button>
              <div className="flex-grow" />
              <Button
                variant="destructive"
                onClick={() => onDelete(entry.id)}
                size="icon"
                aria-label="Move to trash"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

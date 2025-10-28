"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Eye, EyeOff, History } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { type PasswordHistoryEntry } from "@/lib/password-history";
import { useVault } from "@/context/vault-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type PasswordHistoryDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  history: PasswordHistoryEntry[] | undefined;
  serviceName: string;
  onRestorePassword?: (password: string) => void;
};

export function PasswordHistoryDialog({
  isOpen,
  onOpenChange,
  history,
  serviceName,
  onRestorePassword,
}: PasswordHistoryDialogProps) {
  const [revealedPasswords, setRevealedPasswords] = useState<Record<number, boolean>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const toggleVisibility = (index: number) => {
    setRevealedPasswords(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleCopy = (password: string, index: number) => {
    navigator.clipboard.writeText(password).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, "PPP p");
  };

  if (!history || history.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password History</DialogTitle>
            <DialogDescription>
              Previous passwords for {serviceName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No password history available.</p>
            <p className="text-sm mt-1">History will be recorded when you update this password.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Password History</DialogTitle>
          <DialogDescription>
            Previous passwords for {serviceName}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-3">
            {history.map((entry, index) => (
              <div key={index}>
                <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm mb-1">
                      {revealedPasswords[index] ? entry.password : "••••••••••••"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(entry.timestamp)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleVisibility(index)}
                      className="h-8 w-8"
                    >
                      {revealedPasswords[index] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(entry.password, index)}
                      className="h-8 w-8"
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    {onRestorePassword && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onRestorePassword(entry.password);
                          onOpenChange(false);
                        }}
                      >
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
                {index < history.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

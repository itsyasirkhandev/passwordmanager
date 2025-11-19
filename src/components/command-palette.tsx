
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useVault } from "@/context/vault-context";
import { useTokens } from "@/context/token-context";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  FolderPlus,
  Home,
  Shield,
  Archive,
  Star,
  Tag,
  KeyRound,
  Key,
  Network,
} from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type CommandPaletteProps = {
  onAddPassword?: () => void;
  onViewPassword?: (id: string) => void;
  onAddToken?: () => void;
};

export function CommandPalette({ onAddPassword, onViewPassword, onAddToken }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { passwords, folders, allTags, selectFolder, selectTag } = useVault();
  const { tokens } = useTokens();

  const activePasswords = passwords.filter(p => !p.deletedAt);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // Ignore if user is typing in an input, textarea, or contenteditable element
      if (
        target.isContentEditable ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback((callback: () => void) => {
    setOpen(false);
    callback();
  }, []);

  return (
    <>
      <div
        className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border rounded-md cursor-pointer hover:bg-accent transition-colors"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          ⌘K
        </kbd>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <VisuallyHidden>
            <CommandInput placeholder="Type a command or search..." />
        </VisuallyHidden>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Actions">
            {onAddPassword && (
              <CommandItem onSelect={() => handleSelect(onAddPassword)}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Add Password</span>
              </CommandItem>
            )}
            {onAddToken && (
                <CommandItem onSelect={() => handleSelect(onAddToken)}>
                    <Key className="mr-2 h-4 w-4" />
                    <span>Add API Token</span>
                </CommandItem>
            )}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => handleSelect(() => router.push("/dashboard"))}>
              <Home className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect(() => router.push("/vault"))}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Vault</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect(() => router.push("/providers"))}>
              <Network className="mr-2 h-4 w-4" />
              <span>Providers</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect(() => router.push("/tokens"))}>
              <Key className="mr-2 h-4 w-4" />
              <span>API Tokens</span>
            </CommandItem>
             <CommandItem onSelect={() => handleSelect(() => {
              selectFolder('favorites');
              router.push("/vault");
            })}>
              <Star className="mr-2 h-4 w-4" />
              <span>Favorites</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect(() => {
              selectFolder('trash');
              router.push("/vault");
            })}>
              <Archive className="mr-2 h-4 w-4" />
              <span>Trash</span>
            </CommandItem>
          </CommandGroup>
          {folders.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Folders">
                {folders.slice(0, 5).map((folder) => (
                  <CommandItem
                    key={folder.id}
                    onSelect={() => handleSelect(() => {
                      selectFolder(folder.id);
                      router.push("/vault");
                    })}
                  >
                    <FolderPlus className="mr-2 h-4 w-4" />
                    <span>{folder.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
          {allTags.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Tags">
                {allTags.slice(0, 5).map((tag) => (
                  <CommandItem
                    key={tag}
                    onSelect={() => handleSelect(() => {
                      selectTag(tag);
                      router.push("/vault");
                    })}
                  >
                    <Tag className="mr-2 h-4 w-4" />
                    <span>{tag}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
          {activePasswords.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Passwords">
                {activePasswords.slice(0, 5).map((password) => (
                  <CommandItem
                    key={password.id}
                    value={`password-${password.serviceName}-${password.username}`}
                    onSelect={() => handleSelect(() => {
                      if (onViewPassword) {
                        router.push('/vault');
                        onViewPassword(password.id);
                      }
                    })}
                  >
                    <KeyRound className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{password.serviceName}</span>
                      <span className="text-xs text-muted-foreground">{password.username}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
           {tokens.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="API Tokens">
                {tokens.slice(0, 5).map((token) => (
                  <CommandItem
                    key={token.id}
                    value={`token-${token.name}`}
                    onSelect={() => handleSelect(() => router.push('/tokens'))}
                  >
                    <Key className="mr-2 h-4 w-4" />
                    <span>{token.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

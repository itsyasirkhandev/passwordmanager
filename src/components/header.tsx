
"use client"

import { Menu, Lock } from "lucide-react";
import { CipherVaultLogo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type HeaderProps = {
    onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="border-b sticky top-0 z-30 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-1 md:gap-3">
             {onMenuClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            )}
            <Link href="/" className="flex items-center gap-2">
              <CipherVaultLogo className="h-8 w-auto text-primary" />
              <h1 className="text-xl font-bold tracking-tight text-foreground hidden sm:block">
                CipherVault
              </h1>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
}

import { Lock } from "lucide-react";
import { CipherVaultLogo } from "@/components/logo";

export default function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <CipherVaultLogo className="h-8 w-auto text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              CipherVault
            </h1>
          </div>
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}

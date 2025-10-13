
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";

// In a real application, this would be a securely handled authentication flow.
const MASTER_PASSWORD = "password123";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      if (password === MASTER_PASSWORD) {
        toast({
          title: "Success",
          description: "Vault unlocked.",
        });
        // In a real app, you would establish a session
        router.push("/vault");
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: "Incorrect master password. Please try again.",
        });
        setPassword("");
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 text-primary rounded-full p-3 w-fit mb-4">
                <Lock className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold">Master Password</CardTitle>
            <CardDescription>
              Enter your master password to unlock your vault.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="master-password">Password</Label>
                <Input
                  id="master-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">
                      <LogIn className="h-4 w-4" />
                    </span>
                    Unlocking...
                  </>
                ) : (
                   <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Unlock Vault
                   </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}

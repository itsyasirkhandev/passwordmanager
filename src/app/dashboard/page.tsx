"use client";

import { useVault } from "@/context/vault-context";
import Header from "@/components/header";
import { FolderSidebar } from "@/components/folder-sidebar";
import { Star, Trash2, ShieldCheck, ShieldAlert, Folder, KeyRound, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StrengthChart } from "./strength-chart";
import { calculatePasswordStrength } from "@/lib/password-strength";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { passwords, folders, addFolder, selectFolder, selectTag } = useVault();
  
  const activePasswords = passwords.filter(p => !p.deletedAt);
  const totalPasswords = activePasswords.length;
  
  const strengthCounts = activePasswords.reduce((acc, p) => {
    const strength = calculatePasswordStrength(p.password);
    acc[strength.label] = (acc[strength.label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const strengthData = [
    { name: "Weak", value: strengthCounts["Weak"] || 0, fill: "hsl(var(--destructive))" },
    { name: "Medium", value: strengthCounts["Medium"] || 0, fill: "hsl(var(--chart-4))" },
    { name: "Strong", value: strengthCounts["Strong"] || 0, fill: "hsl(var(--primary))" },
    { name: "Very Strong", value: strengthCounts["Very Strong"] || 0, fill: "hsl(var(--chart-2))" },
  ];
  
  const recentlyAdded = [...activePasswords].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const securityRecommendations = [
      ...(strengthCounts['Weak'] > 0 ? [{
          title: "Update Weak Passwords",
          description: `You have ${strengthCounts['Weak']} weak password(s).`,
          icon: ShieldAlert,
          color: "text-destructive",
      }] : []),
      ...(strengthCounts['Medium'] > 0 ? [{
          title: "Improve Medium Passwords",
          description: `You have ${strengthCounts['Medium']} medium strength password(s). Consider making them stronger.`,
          icon: ShieldAlert,
          color: "text-yellow-500",
      }] : []),
  ];
  
  if (securityRecommendations.length === 0) {
      securityRecommendations.push({
          title: "Great Security!",
          description: "All your passwords are rated strong or very strong.",
          icon: ShieldCheck,
          color: "text-green-500"
      })
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 grid md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
        <FolderSidebar
          folders={folders}
          specialFolders={[
            { id: "favorites", name: "Favorites", icon: Star },
            { id: "trash", name: "Trash", icon: Trash2 },
          ]}
          tags={[]} // Tags are dynamically generated in vault view, can be empty here
          selectedFolderId={null}
          selectedTag={null}
          onSelectFolder={selectFolder}
          onSelectTag={selectTag}
          onAddFolder={addFolder}
        />
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
            <h1 className="text-3xl font-bold">Security Dashboard</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Passwords</CardTitle>
                        <KeyRound className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPasswords}</div>
                        <p className="text-xs text-muted-foreground">items in your vault</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Folders</CardTitle>
                        <Folder className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{folders.length}</div>
                        <p className="text-xs text-muted-foreground">categories for organization</p>
                    </CardContent>
                </Card>
                <Card className="col-span-1 md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Weak Passwords</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{strengthCounts['Weak'] || 0}</div>
                        <p className="text-xs text-muted-foreground">passwords need immediate attention</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Password Strength</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <StrengthChart data={strengthData} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Security Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {securityRecommendations.map(rec => {
                            const Icon = rec.icon;
                            return (
                                <div key={rec.title} className="flex items-start gap-4">
                                    <Icon className={cn("h-6 w-6 mt-1 flex-shrink-0", rec.color)} />
                                    <div>
                                        <h3 className="font-semibold">{rec.title}</h3>
                                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Recently Added</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentlyAdded.map(p => (
                            <div key={p.id} className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold">{p.serviceName}</h4>
                                    <p className="text-sm text-muted-foreground">{p.username}</p>
                                </div>
                                 <Button asChild variant="ghost" size="sm">
                                    <Link href="/vault">
                                        View <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        ))}
                         {recentlyAdded.length === 0 && (
                            <p className="text-muted-foreground text-sm">No passwords added yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
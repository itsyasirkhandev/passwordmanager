
"use client";

import { useState } from "react";
import { useVault } from "@/context/vault-context";
import Header from "@/components/header";
import { FolderSidebar, MobileSidebar } from "@/components/folder-sidebar";
import { ShieldCheck, ShieldAlert, Folder, KeyRound, ArrowRight, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StrengthChart } from "./strength-chart";
import { calculatePasswordStrength } from "@/lib/password-strength";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import withAuth from "@/components/withAuth";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardPage() {
  const { passwords, folders, addFolder, selectFolder, selectTag, allTags, selectedFolderId, selectedTag, isLoadingPasswords } = useVault();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  
  const activePasswords = passwords.filter(p => !p.deletedAt);
  const totalPasswords = activePasswords.length;
  
  const strengthCounts = useMemo(() => activePasswords.reduce((acc, p) => {
    const strength = calculatePasswordStrength(p.password);
    acc[strength.label] = (acc[strength.label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>), [activePasswords]);

  const strengthData = useMemo(() => [
    { name: "Weak", value: strengthCounts["Weak"] || 0, fill: "hsl(var(--destructive))" },
    { name: "Medium", value: strengthCounts["Medium"] || 0, fill: "hsl(var(--chart-4))" },
    { name: "Strong", value: strengthCounts["Strong"] || 0, fill: "hsl(var(--primary))" },
    { name: "Very Strong", value: strengthCounts["Very Strong"] || 0, fill: "hsl(var(--chart-2))" },
  ], [strengthCounts]);
  
  const recentlyAdded = useMemo(() => {
    const toDate = (val: any) => val?.toDate ? val.toDate() : val;
    return [...activePasswords].sort((a,b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime()).slice(0, 5)
  }, [activePasswords]);
  
  const duplicatePasswords = useMemo(() => {
    const passwordCounts = activePasswords.reduce((acc, p) => {
        acc[p.password] = (acc[p.password] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(passwordCounts).filter(([_, count]) => count > 1).length;
  }, [activePasswords]);


  const securityRecommendations = useMemo(() => {
      const recs = [];
      if (strengthCounts['Weak'] > 0) {
          recs.push({
              title: "Update Weak Passwords",
              description: `You have ${strengthCounts['Weak']} weak password(s).`,
              icon: ShieldAlert,
              color: "text-destructive",
          });
      }
       if (duplicatePasswords > 0) {
          recs.push({
              title: "Change Reused Passwords",
              description: `You have ${duplicatePasswords} reused password(s). Using the same password for multiple sites is a security risk.`,
              icon: AlertTriangle,
              color: "text-destructive",
          });
      }
      if (strengthCounts['Medium'] > 0) {
          recs.push({
              title: "Improve Medium Passwords",
              description: `You have ${strengthCounts['Medium']} medium strength password(s). Consider making them stronger.`,
              icon: ShieldAlert,
              color: "text-yellow-500",
          });
      }

      if (recs.length === 0) {
          recs.push({
              title: "Great Security!",
              description: "All your passwords are rated strong or very strong and you have no reused passwords.",
              icon: ShieldCheck,
              color: "text-green-500"
          });
      }
      return recs;
  }, [strengthCounts, duplicatePasswords]);
  
  const toggleSidebar = () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
    }
  };

  const renderDashboard = () => (
     <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 overflow-y-auto">
        <h1 className="text-3xl font-bold">Security Dashboard</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Passwords</CardTitle>
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoadingPasswords ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{totalPasswords}</div>}
                    <p className="text-xs text-muted-foreground">items in your vault</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Folders</CardTitle>
                    <Folder className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoadingPasswords ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{folders.length}</div>}
                    <p className="text-xs text-muted-foreground">categories for organization</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Weak Passwords</CardTitle>
                    <ShieldAlert className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    {isLoadingPasswords ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold text-destructive">{strengthCounts['Weak'] || 0}</div>}
                    <p className="text-xs text-muted-foreground">passwords need immediate attention</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reused Passwords</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                     {isLoadingPasswords ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold text-destructive">{duplicatePasswords}</div>}
                    <p className="text-xs text-muted-foreground">passwords appear on multiple sites</p>
                </CardContent>
            </Card>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Password Strength</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoadingPasswords ? <Skeleton className="h-[250px] w-full" /> : <StrengthChart data={strengthData} />}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Security Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoadingPasswords ? (
                        Array.from({length: 2}).map((_, i) => (
                           <div key={i} className="flex items-start gap-4">
                                <Skeleton className="h-6 w-6 mt-1 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-full" />
                                </div>
                            </div>
                        ))
                    ) : (
                        securityRecommendations.map(rec => {
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
                        })
                    )}
                </CardContent>
            </Card>
        </div>
         <Card>
            <CardHeader>
                <CardTitle>Recently Added</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {isLoadingPasswords ? (
                         Array.from({length: 3}).map((_, i) => (
                           <div key={i} className="flex items-center justify-between">
                                <div className="space-y-2">
                                     <Skeleton className="h-4 w-24" />
                                     <Skeleton className="h-3 w-32" />
                                </div>
                                <Skeleton className="h-8 w-20" />
                            </div>
                        ))
                    ) : (
                        <>
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
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Header onMenuClick={toggleSidebar} />
       <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onOpenChange={setIsMobileSidebarOpen}
        folders={folders}
        tags={allTags}
        selectedFolderId={selectedFolderId}
        selectedTag={selectedTag}
        onSelectFolder={selectFolder}
        onSelectTag={selectTag}
        onAddFolder={addFolder}
      />
      <main className={cn(
          "flex-1 grid transition-all duration-300",
          isDesktopSidebarOpen ? "md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]" : "md:grid-cols-[80px_1fr]"
      )}>
        <aside className={cn("hidden md:block transition-all duration-300 overflow-hidden", isDesktopSidebarOpen ? "w-[280px] lg:w-[320px]" : "w-[80px]")}>
           <FolderSidebar
            folders={folders}
            tags={allTags}
            selectedFolderId={selectedFolderId}
            selectedTag={selectedTag}
            onSelectFolder={selectFolder}
            onSelectTag={selectTag}
            onAddFolder={addFolder}
            isCollapsed={!isDesktopSidebarOpen}
            />
        </aside>
        {renderDashboard()}
      </main>
    </div>
  );
}

export default withAuth(DashboardPage);

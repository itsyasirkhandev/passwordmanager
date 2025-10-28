"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type PasswordFormValues } from "@/app/vault/password-form-dialog";

type ImportDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (passwords: PasswordFormValues[]) => Promise<void>;
  defaultFolderId: string;
};

type ImportedPassword = {
  serviceName: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
};

export function ImportDialog({
  isOpen,
  onOpenChange,
  onImport,
  defaultFolderId,
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { toast } = useToast();

  const parseCSV = (text: string): ImportedPassword[] => {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header and one data row");
    }

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const serviceIndex = headers.findIndex(h => h.includes("name") || h.includes("service") || h.includes("title"));
    const usernameIndex = headers.findIndex(h => h.includes("username") || h.includes("user") || h.includes("login"));
    const passwordIndex = headers.findIndex(h => h.includes("password"));
    const urlIndex = headers.findIndex(h => h.includes("url") || h.includes("website") || h.includes("site"));
    const notesIndex = headers.findIndex(h => h.includes("note"));

    if (serviceIndex === -1 || usernameIndex === -1 || passwordIndex === -1) {
      throw new Error("CSV must contain columns for service name, username, and password");
    }

    return lines.slice(1).map((line, index) => {
      const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));

      if (values.length < 3) {
        throw new Error(`Invalid row ${index + 2}: insufficient columns`);
      }

      return {
        serviceName: values[serviceIndex] || `Imported Item ${index + 1}`,
        username: values[usernameIndex] || "",
        password: values[passwordIndex] || "",
        url: urlIndex !== -1 ? values[urlIndex] : undefined,
        notes: notesIndex !== -1 ? values[notesIndex] : undefined,
      };
    });
  };

  const parseJSON = (text: string): ImportedPassword[] => {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) {
      throw new Error("JSON file must contain an array of passwords");
    }

    return data.map((item, index) => ({
      serviceName: item.serviceName || item.name || item.title || `Imported Item ${index + 1}`,
      username: item.username || item.user || item.login || "",
      password: item.password || "",
      url: item.url || item.website || undefined,
      notes: item.notes || item.note || undefined,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please select a file to import");
      return;
    }

    setIsImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const text = await file.text();
      let importedPasswords: ImportedPassword[];

      if (file.name.endsWith(".csv")) {
        importedPasswords = parseCSV(text);
      } else if (file.name.endsWith(".json")) {
        importedPasswords = parseJSON(text);
      } else {
        throw new Error("Unsupported file format. Please use CSV or JSON files.");
      }

      if (importedPasswords.length === 0) {
        throw new Error("No valid passwords found in the file");
      }

      const passwordsToImport: PasswordFormValues[] = importedPasswords.map(p => ({
        serviceName: p.serviceName,
        username: p.username,
        password: p.password,
        url: p.url || "",
        notes: p.notes,
        folderId: defaultFolderId,
        tags: ["imported"],
      }));

      await onImport(passwordsToImport);
      setSuccess(`Successfully imported ${passwordsToImport.length} password(s)`);
      toast({ title: "Import Successful", description: `Imported ${passwordsToImport.length} passwords` });

      setTimeout(() => {
        onOpenChange(false);
        setFile(null);
        setSuccess(null);
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to import passwords";
      setError(errorMessage);
      toast({ variant: "destructive", title: "Import Failed", description: errorMessage });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Passwords</DialogTitle>
          <DialogDescription>
            Upload a CSV or JSON file containing your passwords
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="import-file">Select File</Label>
            <Input
              id="import-file"
              type="file"
              accept=".csv,.json"
              onChange={handleFileChange}
              disabled={isImporting}
            />
            <p className="text-xs text-muted-foreground">
              Supported formats: CSV, JSON
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>CSV Format:</strong> Must include columns for service name, username, and password.<br />
              <strong>JSON Format:</strong> Array of objects with serviceName, username, and password fields.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!file || isImporting}>
              <Upload className="mr-2 h-4 w-4" />
              {isImporting ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

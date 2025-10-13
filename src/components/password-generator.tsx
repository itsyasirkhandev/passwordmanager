"use client";

import { useState, useCallback, useEffect } from "react";
import { RefreshCw, ClipboardCopy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

const AMBIGUOUS_CHARS = "{}[]()/\\'\"`~,;.<>";

type GeneratorOptions = {
  length: number;
  useUppercase: boolean;
  useLowercase: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
  excludeAmbiguous: boolean;
};

type PasswordGeneratorProps = {
  onUsePassword: (password: string) => void;
};

export function PasswordGenerator({ onUsePassword }: PasswordGeneratorProps) {
  const [options, setOptions] = useState<GeneratorOptions>({
    length: 16,
    useUppercase: true,
    useLowercase: true,
    useNumbers: true,
    useSymbols: true,
    excludeAmbiguous: true,
  });
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const generatePassword = useCallback(() => {
    let charset = "";
    if (options.useUppercase) charset += CHARSETS.uppercase;
    if (options.useLowercase) charset += CHARSETS.lowercase;
    if (options.useNumbers) charset += CHARSETS.numbers;
    if (options.useSymbols) charset += CHARSETS.symbols;

    if (options.excludeAmbiguous) {
      charset = charset
        .split("")
        .filter((char) => !AMBIGUOUS_CHARS.includes(char))
        .join("");
    }
    
    if (charset === "") {
        setGeneratedPassword("");
        return;
    }

    let newPassword = "";
    for (let i = 0; i < options.length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      newPassword += charset[randomIndex];
    }
    setGeneratedPassword(newPassword);
  }, [options]);

  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  const handleCopyToClipboard = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword).then(() => {
      setIsCopied(true);
      toast({ title: "Password copied!" });
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleUsePassword = () => {
    if (!generatedPassword) return;
    onUsePassword(generatedPassword);
    toast({ title: "Password used." });
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-lg">Password Generator</CardTitle>
        <CardDescription>Create a strong and secure password.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        <div className="relative">
          <Input
            readOnly
            value={generatedPassword}
            className="pr-10 font-mono text-base"
            aria-label="Generated password"
          />
           <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={handleCopyToClipboard}
              aria-label="Copy password"
            >
              {isCopied ? <Check className="text-primary" /> : <ClipboardCopy />}
            </Button>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="length">Password Length</Label>
              <span className="font-mono text-sm w-8 text-center bg-muted rounded-md py-0.5">{options.length}</span>
            </div>
            <Slider
              id="length"
              min={8}
              max={50}
              step={1}
              value={[options.length]}
              onValueChange={(value) => setOptions(prev => ({ ...prev, length: value[0] }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch id="uppercase" checked={options.useUppercase} onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useUppercase: checked }))} />
              <Label htmlFor="uppercase">Uppercase</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="lowercase" checked={options.useLowercase} onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useLowercase: checked }))} />
              <Label htmlFor="lowercase">Lowercase</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="numbers" checked={options.useNumbers} onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useNumbers: checked }))} />
              <Label htmlFor="numbers">Numbers</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="symbols" checked={options.useSymbols} onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useSymbols: checked }))} />
              <Label htmlFor="symbols">Symbols</Label>
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Switch id="exclude-ambiguous" checked={options.excludeAmbiguous} onCheckedChange={(checked) => setOptions(prev => ({ ...prev, excludeAmbiguous: checked }))} />
            <Label htmlFor="exclude-ambiguous">Exclude Ambiguous Characters</Label>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-0 pt-6 flex justify-between gap-2">
        <Button variant="outline" onClick={generatePassword} className="w-full">
          <RefreshCw className="mr-2" />
          Regenerate
        </Button>
        <Button onClick={handleUsePassword} className="w-full">
          Use Password
        </Button>
      </CardFooter>
    </Card>
  );
}

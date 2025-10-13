"use client";

import { cn } from "@/lib/utils";
import { calculatePasswordStrength, type PasswordStrength } from "@/lib/password-strength";

type PasswordStrengthIndicatorProps = {
  password?: string;
};

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = calculatePasswordStrength(password || "");

  if (!password) {
    return <div className="h-1.5 w-full bg-muted rounded-full" />;
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i < strength.score ? strength.color.replace('bg-','bg-') : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className={cn(
        "text-xs font-medium",
        strength.score === 1 && "text-red-500",
        strength.score === 2 && "text-yellow-500",
        strength.score === 3 && "text-primary",
        strength.score >= 4 && "text-green-500",
      )}>
        {strength.label}
      </p>
    </div>
  );
}

export function PasswordStrengthPill({ password }: { password?: string }) {
    const strength = calculatePasswordStrength(password || "");

    if (strength.score > 2) return null;

    return (
        <div className={cn("text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5", 
            strength.score === 1 && "bg-destructive/10 text-destructive",
            strength.score === 2 && "bg-yellow-500/10 text-yellow-600"
        )}>
           <div className={cn("h-1.5 w-1.5 rounded-full", strength.color)}></div>
           {strength.label}
        </div>
    )
}

"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tags: string[];
  setTags: (tags: string[]) => void;
}

export const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(
  ({ tags, setTags, className, ...props }, ref) => {
    const [inputValue, setInputValue] = useState("");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const newTag = inputValue.trim();
        if (newTag && !tags.includes(newTag)) {
          setTags([...tags, newTag]);
        }
        setInputValue("");
      } else if (e.key === "Backspace" && inputValue === "") {
        const newTags = tags.slice(0, -1);
        setTags(newTags);
      }
    };

    const removeTag = (tagToRemove: string) => {
      setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    return (
      <div>
        <div
          className={cn(
            "flex flex-wrap gap-2 rounded-md border border-input bg-background p-2 text-sm ring-offset-background",
            className
          )}
        >
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary">
              {tag}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeTag(tag)}
                className="ml-1 h-4 w-4"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          <input
            ref={ref}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            {...props}
          />
        </div>
      </div>
    );
  }
);

TagInput.displayName = "TagInput";

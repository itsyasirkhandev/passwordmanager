"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

type NotesTemplate = {
  name: string;
  template: string;
};

const notesTemplates: NotesTemplate[] = [
  {
    name: "Security Questions",
    template: `Security Questions:

Q1: What was your first pet's name?
A1:

Q2: What city were you born in?
A2:

Q3: What is your mother's maiden name?
A3: `,
  },
  {
    name: "Recovery Codes",
    template: `Recovery/Backup Codes:

1.
2.
3.
4.
5.
6.
7.
8.

Last Updated:
Next Review: `,
  },
  {
    name: "Credit Card Info",
    template: `Card Details:

Cardholder Name:
Card Number:
Expiry Date:
CVV:
Billing Address:

Notes: `,
  },
  {
    name: "Two-Factor Setup",
    template: `Two-Factor Authentication:

Method: (SMS/App/Email)
Phone/Email:
Secret Key:
Backup Codes:

Setup Date:
Notes: `,
  },
  {
    name: "Account Details",
    template: `Account Information:

Account ID/Number:
Registration Email:
Alternate Email:
Phone Number:
Account Created:
Subscription Type:

Additional Notes: `,
  },
  {
    name: "Password History",
    template: `Password Change Log:

Previous Password 1:
Changed:

Previous Password 2:
Changed:

Reminder: This password was last changed on [date]
Next change recommended: [date]`,
  },
];

type NotesTemplateDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: string) => void;
};

export function NotesTemplateDialog({
  isOpen,
  onOpenChange,
  onSelectTemplate,
}: NotesTemplateDialogProps) {
  const handleSelectTemplate = (template: string) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Notes Templates</DialogTitle>
          <DialogDescription>
            Choose a template to quickly fill in common information
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[500px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-4">
            {notesTemplates.map((template) => (
              <Button
                key={template.name}
                variant="outline"
                className="h-auto flex flex-col items-start p-4 hover:bg-accent"
                onClick={() => handleSelectTemplate(template.template)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-semibold">{template.name}</span>
                </div>
                <pre className="text-xs text-left text-muted-foreground whitespace-pre-wrap line-clamp-4">
                  {template.template}
                </pre>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

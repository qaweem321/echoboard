"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { useCopy } from "./use-copy";

const messages = {
  idle: "",
  copied: "Copied.",
  select: "Selected. Press Ctrl+C (or ⌘C on a Mac) to copy.",
};

// A block of code to paste somewhere else, with a Copy button.
export function CodeSnippet({ code, label }: { code: string; label: string }) {
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const { status, copy } = useCopy();

  return (
    <div className="space-y-2">
      <textarea
        ref={fieldRef}
        readOnly
        value={code}
        aria-label={label}
        rows={code.split("\n").length}
        onFocus={(event) => event.currentTarget.select()}
        className={cn(inputClasses, "resize-none font-mono text-sm")}
      />
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={() => copy(code, fieldRef.current)}>
          Copy code
        </Button>
        <p aria-live="polite" className="text-sm text-success">
          {messages[status]}
        </p>
      </div>
    </div>
  );
}

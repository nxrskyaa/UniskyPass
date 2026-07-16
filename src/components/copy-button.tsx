"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function CopyButton({ value, children, ...props }: { value: string } & ButtonProps) {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    },
    [],
  );

  return (
    <Button
      variant="quiet"
      size="sm"
      {...props}
      onClick={async (event) => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
          resetTimerRef.current = window.setTimeout(() => setCopied(false), 1_500);
        } catch {
          setCopied(false);
        }
        props.onClick?.(event);
      }}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copied" : (children ?? "Copy")}
    </Button>
  );
}

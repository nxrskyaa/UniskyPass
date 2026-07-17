import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  HTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-2 block text-sm font-semibold text-ink", className)}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-12 w-full rounded-xl border border-line bg-white px-3.5 text-base text-ink shadow-[inset_0_1px_0_rgb(17_18_23/4%)] transition placeholder:text-ink-soft/55 hover:border-ink-soft focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/10",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-y rounded-xl border border-line bg-white px-3.5 py-3 text-base text-ink shadow-[inset_0_1px_0_rgb(17_18_23/4%)] transition placeholder:text-ink-soft/55 hover:border-ink-soft focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/10",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-12 w-full rounded-xl border border-line bg-white px-3.5 text-base text-ink transition hover:border-ink-soft focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/10",
        className,
      )}
      {...props}
    />
  );
}

export function FieldError({ children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;
  return (
    <p
      role="alert"
      aria-live="polite"
      className="mt-2 text-sm font-medium text-danger"
      {...props}
    >
      {children}
    </p>
  );
}

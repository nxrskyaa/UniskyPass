import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-ink bg-ink text-white shadow-[3px_3px_0_var(--violet)] hover:-translate-y-0.5 hover:shadow-[4px_5px_0_var(--violet)] active:translate-y-0 active:shadow-[1px_1px_0_var(--violet)]",
  secondary:
    "border-ink bg-paper text-ink shadow-[2px_2px_0_var(--ink)] hover:-translate-y-0.5 hover:bg-white active:translate-y-0 active:shadow-none",
  quiet:
    "border-transparent bg-transparent text-ink hover:border-line hover:bg-white/70",
  danger:
    "border-danger bg-danger text-white shadow-[2px_2px_0_var(--ink)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-1.5 text-sm",
  md: "min-h-11 px-4 py-2.5 text-sm",
  lg: "min-h-12 px-5 py-3 text-base",
  icon: "size-11 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex select-none items-center justify-center gap-2 border font-semibold transition duration-300 disabled:pointer-events-none disabled:opacity-45",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);

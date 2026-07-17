import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const hasCustomBackground = className
    ?.split(/\s+/)
    .some((token) => token.startsWith("bg-") || token.startsWith("!bg-"));

  return (
    <div
      className={cn(
        "border border-line shadow-[4px_4px_0_var(--ink)] transition-[border-color,box-shadow,transform] duration-300 hover:border-ink/55 hover:shadow-[6px_6px_0_var(--ink)]",
        !hasCustomBackground && "bg-white/82",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pb-0 sm:p-6 sm:pb-0", className)} {...props} />;
}

export function CardBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 sm:p-6", className)} {...props} />;
}

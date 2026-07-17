import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const hasCustomBackground = className
    ?.split(/\s+/)
    .some((token) => token.startsWith("bg-") || token.startsWith("!bg-"));

  return (
    <div
      className={cn(
        "rounded-[1.4rem] border border-line shadow-[0_18px_55px_rgb(17_18_23/8%)] backdrop-blur-sm transition-[border-color,box-shadow,transform] duration-300 hover:border-ink/35 hover:shadow-[0_24px_75px_rgb(17_18_23/11%)]",
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

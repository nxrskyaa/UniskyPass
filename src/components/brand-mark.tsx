import { cn } from "@/lib/cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-grid size-9 shrink-0 place-items-center overflow-hidden border border-ink bg-ink text-lime shadow-[2px_2px_0_var(--violet)]",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" className="size-7" fill="none" aria-hidden="true">
        <path d="M7 6v11.2a9 9 0 0 0 18 0V6" stroke="currentColor" strokeWidth="3.2" strokeLinecap="square" />
        <path d="M5 26h22" stroke="var(--violet)" strokeWidth="2.4" strokeLinecap="square" />
      </svg>
    </span>
  );
}

import { cn } from "@/lib/cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-grid size-9 shrink-0 place-items-center overflow-hidden rounded-[0.7rem] border border-ink bg-ink text-lime shadow-[2px_2px_0_var(--violet)]",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" className="size-7" fill="none">
        <path
          d="M5 8h22v9.2a5.5 5.5 0 0 0-5.5 5.5h-11A5.5 5.5 0 0 0 5 17.2V8Z"
          fill="currentColor"
        />
        <path d="M10.5 8v14.7" stroke="#6c4cff" strokeWidth="2" strokeDasharray="2 2" />
        <path
          d="m17 11.8 1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.2-2.4 1.2.5-2.6-1.9-1.8 2.6-.4 1.2-2.4Z"
          fill="#111217"
        />
      </svg>
    </span>
  );
}

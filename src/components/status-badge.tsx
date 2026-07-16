import { Clock3, CircleCheck, CircleOff, Hourglass, SearchX } from "lucide-react";
import { cn } from "@/lib/cn";
import { PASS_STATUS, type PassStatusCode } from "@/lib/chain/format";

const statusStyles: Record<PassStatusCode, string> = {
  0: "border-line bg-paper-deep text-ink-soft",
  1: "border-sky bg-sky/35 text-ink",
  2: "border-success/25 bg-success/10 text-success",
  3: "border-warning/25 bg-warning/10 text-warning",
  4: "border-danger/25 bg-danger/10 text-danger",
};

const statusIcons = {
  0: SearchX,
  1: Hourglass,
  2: CircleCheck,
  3: Clock3,
  4: CircleOff,
} as const;

export function StatusBadge({
  status,
  className,
}: {
  status: PassStatusCode;
  className?: string;
}) {
  const Icon = statusIcons[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold",
        statusStyles[status],
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {PASS_STATUS[status]}
    </span>
  );
}

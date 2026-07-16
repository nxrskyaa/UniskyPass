import type { ReactNode } from "react";
import { Ticket } from "lucide-react";
import { Card } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Card className="border-dashed bg-white/55 p-7 text-center sm:p-10">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-ink bg-lime shadow-[3px_3px_0_var(--ink)]">
        {icon ?? <Ticket className="size-5" aria-hidden />}
      </div>
      <h2 className="mt-5 text-xl font-bold tracking-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </Card>
  );
}

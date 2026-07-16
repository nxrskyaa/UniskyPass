import Link from "next/link";
import { ArrowUpRight, CalendarClock, Fingerprint } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { formatDate, shortenAddress } from "@/lib/chain/format";
import type { MemberPass } from "@/lib/chain/records";

export function PassCard({ item }: { item: MemberPass }) {
  return (
    <Card className="group relative overflow-hidden transition hover:-translate-y-1 hover:border-ink hover:shadow-[5px_6px_0_var(--violet)]">
      <div className="absolute top-0 right-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-violet/12 transition-transform group-hover:scale-125" />
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <StatusBadge status={item.status} />
          <span className="font-mono text-xs font-semibold text-ink-soft">#{item.id.toString()}</span>
        </div>
        <h2 className="mt-6 text-2xl font-black tracking-[-0.045em]">{item.program.name}</h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
          <Fingerprint className="size-4" aria-hidden />
          Issued by <span className="font-mono">{shortenAddress(item.pass.issuer)}</span>
        </p>
        <div className="mt-6 border-t border-dashed border-line pt-4">
          <div className="flex items-center gap-2 text-sm">
            <CalendarClock className="size-4 text-violet" aria-hidden />
            <span className="text-ink-soft">Valid until</span>
            <span className="ml-auto font-semibold">{formatDate(item.pass.expiresAt)}</span>
          </div>
        </div>
        <Link
          href={`/passes/${item.id.toString()}`}
          className="mt-5 flex min-h-11 items-center justify-between rounded-xl border border-line bg-paper px-3.5 text-sm font-bold transition group-hover:border-ink group-hover:bg-lime"
        >
          View pass
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
      <div className="h-2 bg-[repeating-linear-gradient(90deg,var(--violet)_0_14px,transparent_14px_22px)]" />
    </Card>
  );
}

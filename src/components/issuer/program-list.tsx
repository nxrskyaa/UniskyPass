"use client";

import Link from "next/link";
import { Pause, Play, QrCode, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useContractMutation } from "@/hooks/use-contract-mutation";
import { formatDuration } from "@/lib/chain/format";
import type { IssuerProgram } from "@/lib/chain/records";

export function ProgramList({ programs }: { programs: IssuerProgram[] }) {
  if (programs.length === 0) return null;
  return (
    <section aria-labelledby="programs-heading">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-bold tracking-[0.14em] text-violet uppercase">Programs</p>
          <h2 id="programs-heading" className="mt-1 text-2xl font-black tracking-tight">Your pass programs</h2>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {programs.map((program) => <ProgramCard key={program.id.toString()} item={program} />)}
      </div>
    </section>
  );
}

function ProgramCard({ item }: { item: IssuerProgram }) {
  const mutation = useContractMutation();
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-bold text-ink-soft">PROGRAM #{item.id.toString()}</p>
          <h3 className="mt-2 text-xl font-black tracking-tight">{item.program.name}</h3>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${item.program.active ? "border-success/25 bg-success/10 text-success" : "border-line bg-paper-deep text-ink-soft"}`}>
          {item.program.active ? "ACTIVE" : "PAUSED"}
        </span>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl bg-paper p-3.5 text-sm">
        <div>
          <p className="text-xs text-ink-soft">Duration</p>
          <p className="mt-1 font-bold">{formatDuration(item.program.duration)}</p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-xs text-ink-soft"><Users className="size-3.5" /> Passes</p>
          <p className="mt-1 font-bold">{item.passIds.length}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/scanner?programId=${item.id.toString()}`}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-ink bg-ink px-3 text-xs font-bold text-white"
        >
          <QrCode className="size-3.5" /> Open scanner
        </Link>
        <Button
          size="sm"
          variant="quiet"
          disabled={mutation.isPending}
          onClick={async () => {
            try {
              await mutation.execute({
                functionName: "setProgramActive",
                args: [item.id, !item.program.active],
                pendingTitle: item.program.active ? "Pausing program" : "Resuming program",
                successTitle: item.program.active ? "Program paused" : "Program resumed",
              });
            } catch {
              // The mutation hook owns user-facing feedback.
            }
          }}
        >
          {item.program.active ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {item.program.active ? "Pause" : "Resume"}
        </Button>
      </div>
    </Card>
  );
}

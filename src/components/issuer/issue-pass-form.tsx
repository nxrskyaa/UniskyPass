"use client";

import { Send } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/field";
import { useContractMutation } from "@/hooks/use-contract-mutation";
import type { IssuerProgram } from "@/lib/chain/records";
import {
  parseHolderAddress,
  parseScheduledStart,
  validateIssuerNote,
  validateMemberLabel,
} from "@/lib/validation/contract-forms";

export function IssuePassForm({ programs }: { programs: IssuerProgram[] }) {
  const activePrograms = useMemo(() => programs.filter(({ program }) => program.active), [programs]);
  const [programId, setProgramId] = useState(activePrograms[0]?.id.toString() ?? "");
  const [holder, setHolder] = useState("");
  const [memberLabel, setMemberLabel] = useState("");
  const [issuerNote, setIssuerNote] = useState("");
  const [startMode, setStartMode] = useState<"now" | "scheduled">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState<string>();
  const mutation = useContractMutation();

  const selectedProgramId = activePrograms.some(({ id }) => id.toString() === programId)
    ? programId
    : (activePrograms[0]?.id.toString() ?? "");

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-black tracking-tight">Issue a membership pass</h2>
        <p className="mt-1 text-sm leading-6 text-ink-soft">The holder wallet is the identity. Double-check it before confirming.</p>
      </CardHeader>
      <CardBody>
        {activePrograms.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-paper p-4 text-sm leading-6 text-ink-soft">Create or resume a program before issuing a pass.</p>
        ) : (
          <form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const addressResult = parseHolderAddress(holder);
              if ("error" in addressResult) {
                setError(addressResult.error);
                return;
              }
              const startResult = startMode === "scheduled" ? parseScheduledStart(scheduledAt) : { timestamp: 0n };
              if ("error" in startResult) {
                setError(startResult.error);
                return;
              }
              if (!selectedProgramId) {
                setError("Choose an active program.");
                return;
              }
              const labelError = validateMemberLabel(memberLabel);
              if (labelError) {
                setError(labelError);
                return;
              }
              const noteError = validateIssuerNote(issuerNote);
              if (noteError) {
                setError(noteError);
                return;
              }
              setError(undefined);
              try {
                await mutation.execute({
                  functionName: "issuePassWithDetails",
                  args: [BigInt(selectedProgramId), addressResult.address, startResult.timestamp, memberLabel.trim(), issuerNote.trim()],
                  pendingTitle: "Issuing membership pass",
                  successTitle: "Membership pass issued",
                });
                setHolder("");
                setMemberLabel("");
                setIssuerNote("");
                setScheduledAt("");
                setStartMode("now");
              } catch {
                // The mutation hook owns user-facing error feedback.
              }
            }}
          >
            <div>
              <Label htmlFor="issue-program">Program</Label>
              <Select id="issue-program" aria-describedby="issue-pass-error" aria-invalid={Boolean(error ?? mutation.lastError)} value={selectedProgramId} onChange={(event) => setProgramId(event.target.value)}>
                {activePrograms.map(({ id, program }) => <option key={id.toString()} value={id.toString()}>{program.name}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="holder-wallet">Holder wallet address</Label>
              <Input id="holder-wallet" aria-describedby="issue-pass-error" aria-invalid={Boolean(error ?? mutation.lastError)} value={holder} onChange={(event) => setHolder(event.target.value)} placeholder="0x…" autoComplete="off" spellCheck={false} className="font-mono text-sm" />
            </div>
            <div>
              <Label htmlFor="member-label">Member label <span className="font-normal text-ink-soft">(public, optional)</span></Label>
              <Input id="member-label" aria-describedby="member-label-help issue-pass-error" aria-invalid={Boolean(error ?? mutation.lastError)} value={memberLabel} onChange={(event) => setMemberLabel(event.target.value)} placeholder="e.g. Founding member" maxLength={64} autoComplete="off" />
              <p id="member-label-help" className="mt-1.5 text-xs leading-5 text-ink-soft">Shown on the pass. Use a short label, not legal or sensitive identity data.</p>
            </div>
            <div>
              <Label htmlFor="issuer-note">Issuer note <span className="font-normal text-ink-soft">(public, optional)</span></Label>
              <Textarea id="issuer-note" aria-describedby="issuer-note-help issue-pass-error" aria-invalid={Boolean(error ?? mutation.lastError)} value={issuerNote} onChange={(event) => setIssuerNote(event.target.value)} placeholder="e.g. Morning access · paid in full" maxLength={160} />
              <p id="issuer-note-help" className="mt-1.5 text-xs leading-5 text-ink-soft">A visible operational note for this pass. Keep it short and non-sensitive.</p>
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Pass starts</legend>
              <div className="flex flex-wrap gap-2">
                {(["now", "scheduled"] as const).map((mode) => (
                  <label key={mode} className={`cursor-pointer rounded-xl border px-3.5 py-2 text-sm font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-violet ${startMode === mode ? "border-ink bg-lime" : "border-line bg-white"}`}>
                    <input type="radio" className="sr-only" name="start-mode" value={mode} checked={startMode === mode} onChange={() => setStartMode(mode)} />
                    {mode === "now" ? "Start now" : "Schedule"}
                  </label>
                ))}
              </div>
            </fieldset>
            {startMode === "scheduled" ? (
              <div>
                <Label htmlFor="scheduled-start">Future date and time</Label>
                <Input id="scheduled-start" aria-describedby="issue-pass-error" aria-invalid={Boolean(error ?? mutation.lastError)} type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
              </div>
            ) : null}
            <FieldError id="issue-pass-error">{error ?? mutation.lastError}</FieldError>
            <div>
              <Button type="submit" disabled={mutation.isPending}>
                <Send className="size-4" /> {mutation.isPending ? "Confirm in wallet…" : "Issue pass"}
              </Button>
              {mutation.gasQuote ? <p className="mt-2 text-xs text-ink-soft">Maximum estimated network cost: {mutation.gasQuote.formatted}</p> : null}
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  );
}

"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui/field";
import { useContractMutation } from "@/hooks/use-contract-mutation";
import {
  daysToSeconds,
  validateDisplayName,
  validateDurationDays,
} from "@/lib/validation/contract-forms";

export function CreateProgramForm() {
  const [name, setName] = useState("");
  const [days, setDays] = useState(30);
  const [error, setError] = useState<string>();
  const mutation = useContractMutation();

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-black tracking-tight">Create a pass program</h2>
        <p className="mt-1 text-sm leading-6 text-ink-soft">Each issued pass receives this fixed validity duration.</p>
      </CardHeader>
      <CardBody>
        <form
          className="grid gap-4 sm:grid-cols-[1fr_9rem]"
          onSubmit={async (event) => {
            event.preventDefault();
            const validationError = validateDisplayName(name) ?? validateDurationDays(days);
            setError(validationError);
            if (validationError) return;
            try {
              await mutation.execute({
                functionName: "createProgram",
                args: [name.trim(), daysToSeconds(days)],
                pendingTitle: "Creating program",
                successTitle: "Pass program created",
              });
              setName("");
            } catch {
              // The mutation hook owns user-facing error feedback.
            }
          }}
        >
          <div>
            <Label htmlFor="program-name">Program name</Label>
            <Input id="program-name" aria-describedby="create-program-error" aria-invalid={Boolean(error ?? mutation.lastError)} value={name} onChange={(event) => setName(event.target.value)} placeholder="Monthly Access" maxLength={64} />
          </div>
          <div>
            <Label htmlFor="program-days">Days valid</Label>
            <Input id="program-days" aria-describedby="create-program-error" aria-invalid={Boolean(error ?? mutation.lastError)} type="number" min={1} max={3650} value={days} onChange={(event) => setDays(Number(event.target.value))} />
          </div>
          <div className="sm:col-span-2">
            <FieldError id="create-program-error">{error ?? mutation.lastError}</FieldError>
            <Button type="submit" disabled={mutation.isPending}>
              <Plus className="size-4" /> {mutation.isPending ? "Creating…" : "Create program"}
            </Button>
            {mutation.gasQuote ? <p className="mt-2 text-xs text-ink-soft">Maximum estimated network cost: {mutation.gasQuote.formatted}</p> : null}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

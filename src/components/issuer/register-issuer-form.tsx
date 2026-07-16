"use client";

import { Building2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui/field";
import { useContractMutation } from "@/hooks/use-contract-mutation";
import { validateDisplayName } from "@/lib/validation/contract-forms";

export function RegisterIssuerForm() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const mutation = useContractMutation();

  return (
    <Card className="mx-auto max-w-2xl border-ink">
      <CardHeader>
        <div className="grid size-11 place-items-center rounded-xl border border-ink bg-lime shadow-[2px_2px_0_var(--ink)]">
          <Building2 className="size-5" />
        </div>
        <h2 className="mt-5 text-2xl font-black tracking-[-0.04em]">Register this wallet as an issuer</h2>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          Any wallet can issue passes. Use a short public place or community name—never a legal name or private information.
        </p>
      </CardHeader>
      <CardBody>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const validationError = validateDisplayName(name);
            setError(validationError);
            if (validationError) return;
            try {
              await mutation.execute({
                functionName: "registerIssuer",
                args: [name.trim()],
                pendingTitle: "Registering issuer",
                successTitle: "Issuer profile registered",
              });
            } catch {
              // The hook surfaces the exact wallet or contract error.
            }
          }}
        >
          <Label htmlFor="issuer-name">Issuer display name</Label>
          <Input
            id="issuer-name"
            aria-describedby="issuer-name-error"
            aria-invalid={Boolean(error ?? mutation.lastError)}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Optimum Gym"
            autoComplete="organization"
            maxLength={64}
          />
          <FieldError id="issuer-name-error">{error ?? mutation.lastError}</FieldError>
          <Button type="submit" className="mt-5 w-full sm:w-auto" disabled={mutation.isPending}>
            {mutation.isPending ? "Confirm in wallet…" : "Register issuer"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

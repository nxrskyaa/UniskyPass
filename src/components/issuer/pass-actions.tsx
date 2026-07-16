"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Dialog from "@radix-ui/react-dialog";
import { CalendarPlus, CircleAlert, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";
import { useContractMutation } from "@/hooks/use-contract-mutation";
import { daysToSeconds, validateDurationDays } from "@/lib/validation/contract-forms";

export function PassActions({ passId, revoked }: { passId: bigint; revoked: boolean }) {
  const [extendOpen, setExtendOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [days, setDays] = useState(30);
  const [error, setError] = useState<string>();
  const extendMutation = useContractMutation();
  const revokeMutation = useContractMutation();

  return (
    <div className="flex flex-wrap gap-1.5">
      <Dialog.Root open={extendOpen} onOpenChange={setExtendOpen}>
        <Dialog.Trigger asChild>
          <Button size="sm" variant="quiet" disabled={revoked}>
            <CalendarPlus className="size-3.5" /> Extend
          </Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/45 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-ink bg-paper p-5 shadow-[6px_6px_0_var(--violet)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-xl font-black tracking-tight">Extend pass #{passId.toString()}</Dialog.Title>
                <Dialog.Description className="mt-2 text-sm leading-6 text-ink-soft">Active passes extend from their expiry. Expired passes renew from the current chain time.</Dialog.Description>
              </div>
              <Dialog.Close className="rounded-lg p-2 hover:bg-white" aria-label="Close"><X className="size-4" /></Dialog.Close>
            </div>
            <form
              className="mt-5"
              onSubmit={async (event) => {
                event.preventDefault();
                const validationError = validateDurationDays(days);
                setError(validationError);
                if (validationError) return;
                try {
                  await extendMutation.execute({
                    functionName: "extendPass",
                    args: [passId, daysToSeconds(days)],
                    pendingTitle: "Extending membership",
                    successTitle: "Membership extended",
                  });
                  setExtendOpen(false);
                } catch {
                  // The mutation hook owns user-facing feedback.
                }
              }}
            >
              <Label htmlFor={`extend-days-${passId}`}>Additional days</Label>
              <Input id={`extend-days-${passId}`} aria-describedby={`extend-days-error-${passId}`} aria-invalid={Boolean(error ?? extendMutation.lastError)} type="number" min={1} max={3650} value={days} onChange={(event) => setDays(Number(event.target.value))} />
              <FieldError id={`extend-days-error-${passId}`}>{error ?? extendMutation.lastError}</FieldError>
              <div className="mt-5 flex justify-end gap-2">
                <Dialog.Close asChild><Button variant="quiet">Cancel</Button></Dialog.Close>
                <Button type="submit" disabled={extendMutation.isPending}>{extendMutation.isPending ? "Confirming…" : "Extend pass"}</Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AlertDialog.Root open={revokeOpen} onOpenChange={setRevokeOpen}>
        <AlertDialog.Trigger asChild>
          <Button size="sm" variant="quiet" className="text-danger hover:border-danger/25 hover:bg-danger/5" disabled={revoked}>
            <Trash2 className="size-3.5" /> Revoke
          </Button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-ink/45 backdrop-blur-sm" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-danger bg-paper p-5 shadow-[6px_6px_0_var(--danger)]">
            <CircleAlert className="size-8 text-danger" />
            <AlertDialog.Title className="mt-4 text-xl font-black tracking-tight">Permanently revoke pass #{passId.toString()}?</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-6 text-ink-soft">
              This cannot be undone. A revoked pass can never be extended or made valid again; you must issue a new pass instead.
            </AlertDialog.Description>
            {revokeMutation.lastError ? <p role="alert" aria-live="polite" className="mt-3 text-sm font-medium text-danger">{revokeMutation.lastError}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <AlertDialog.Cancel asChild><Button variant="quiet">Keep pass</Button></AlertDialog.Cancel>
              <Button
                variant="danger"
                disabled={revokeMutation.isPending}
                onClick={async () => {
                  try {
                    await revokeMutation.execute({
                      functionName: "revokePass",
                      args: [passId],
                      pendingTitle: "Revoking membership",
                      successTitle: "Membership permanently revoked",
                    });
                    setRevokeOpen(false);
                  } catch {
                    // Keep the dialog open; the hook shows the exact error.
                  }
                }}
              >
                {revokeMutation.isPending ? "Confirming…" : "Revoke permanently"}
              </Button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}

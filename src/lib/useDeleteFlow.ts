import { useState, type ReactNode } from "react";

export interface PendingDelete {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  run: () => Promise<void>;
}

// Shared confirm-then-delete flow used by every entity page: request() opens
// the dialog, confirm() runs the delete with a busy flag and routes failures
// to the page's error handler. Keeps the destructive UX identical everywhere.
export function useDeleteFlow(onError: (message: string) => void) {
  const [pending, setPending] = useState<PendingDelete | null>(null);
  const [busy, setBusy] = useState(false);

  function request(p: PendingDelete) {
    setPending(p);
  }

  async function confirm() {
    if (!pending) return;
    setBusy(true);
    try {
      await pending.run();
      setPending(null);
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    setPending(null);
  }

  return { pending, busy, request, confirm, cancel };
}

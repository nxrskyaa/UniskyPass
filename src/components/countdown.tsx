"use client";

import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

export function Countdown({ expiresAt, onExpire }: { expiresAt: number; onExpire?: () => void }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, expiresAt - Math.floor(Date.now() / 1_000)));

  useEffect(() => {
    let expiredCalled = false;
    const update = () => {
      const next = Math.max(0, expiresAt - Math.floor(Date.now() / 1_000));
      setRemaining(next);
      if (next === 0 && !expiredCalled) {
        expiredCalled = true;
        onExpire?.();
      }
    };
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [expiresAt, onExpire]);

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs font-bold ${remaining <= 10 ? "border-danger/25 bg-danger/10 text-danger" : "border-line bg-white text-ink"}`}>
      <Clock3 className="size-3.5" /> {remaining}s
    </span>
  );
}

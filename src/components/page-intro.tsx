import type { ReactNode } from "react";

export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-ink/12 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="font-mono text-xs font-bold tracking-[0.16em] text-violet uppercase">{eyebrow}</p>
        <h1 className="balance-text mt-3 text-4xl font-black tracking-[-0.055em] sm:text-5xl">{title}</h1>
        <p className="pretty-text mt-3 max-w-xl text-base leading-7 text-ink-soft">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

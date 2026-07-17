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
    <div className="reveal-up page-intro-shell relative flex flex-col gap-5 overflow-hidden rounded-[1.7rem] border border-ink/10 bg-white/58 p-6 shadow-[0_24px_70px_rgb(17_18_23/7%)] backdrop-blur sm:flex-row sm:items-end sm:justify-between sm:p-8">
      <div className="page-intro-glow" aria-hidden />
      <div className="relative max-w-2xl">
        <p className="font-mono text-xs font-bold tracking-[0.16em] text-violet uppercase">{eyebrow}</p>
        <h1 className="balance-text mt-3 text-4xl font-black tracking-[-0.06em] sm:text-6xl">{title}</h1>
        <p className="pretty-text mt-3 max-w-xl text-base leading-7 text-ink-soft">{description}</p>
      </div>
      {action ? <div className="relative shrink-0">{action}</div> : null}
    </div>
  );
}

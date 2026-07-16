import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export function AppFooter() {
  return (
    <footer className="border-t border-ink/10 bg-paper-deep/70 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <BrandMark className="size-8 rounded-lg shadow-none" />
            <span className="font-black tracking-[-0.04em]">UNISKY PASS</span>
          </div>
          <p className="mt-3 max-w-md text-sm leading-6 text-ink-soft">
            Verifiable membership passes on Monad. The app never holds your money or personal data.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-ink-soft">
          <Link href="/passes" className="hover:text-ink">My Passes</Link>
          <Link href="/issuer" className="hover:text-ink">Issuer</Link>
          <Link href="/scanner" className="hover:text-ink">Scanner</Link>
          <a href="https://monad.xyz" target="_blank" rel="noreferrer" className="hover:text-ink">
            Built on Monad ↗
          </a>
        </div>
      </div>
    </footer>
  );
}

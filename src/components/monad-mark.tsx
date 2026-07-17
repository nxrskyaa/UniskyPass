import Image from "next/image";

export function MonadMark({ className }: { className?: string }) {
  return <Image src="/monad-logomark.svg" className={className} alt="" aria-hidden width={40} height={40} priority />;
}

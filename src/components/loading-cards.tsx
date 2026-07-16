export function LoadingCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-64 animate-pulse rounded-[1.4rem] border border-line bg-white/65 p-5"
        >
          <div className="h-5 w-24 rounded-full bg-paper-deep" />
          <div className="mt-7 h-7 w-2/3 rounded bg-paper-deep" />
          <div className="mt-3 h-4 w-1/2 rounded bg-paper-deep" />
          <div className="mt-12 h-px bg-line" />
          <div className="mt-5 h-10 rounded-xl bg-paper-deep" />
        </div>
      ))}
    </div>
  );
}

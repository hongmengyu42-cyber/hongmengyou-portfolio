/** Loading placeholder. Hidden from assistive tech; the surrounding region announces loading instead. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-control bg-line ${className}`} />;
}

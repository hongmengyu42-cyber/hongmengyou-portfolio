import type { ReactNode } from 'react';

type Tone = 'neutral' | 'accent' | 'outline';

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-muted border border-line',
  accent: 'bg-surface-2 text-accent-text border border-line',
  outline: 'border border-field text-muted',
};

export function Badge({ tone = 'neutral', children, mono = false }: { tone?: Tone; children: ReactNode; mono?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]} ${mono ? 'font-mono' : ''}`}
    >
      {children}
    </span>
  );
}

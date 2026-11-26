export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-5 text-[0.9375rem] font-medium ' +
  'transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-btn text-btn-fg hover:bg-btn-hover shadow-soft',
  secondary: 'border border-field text-ink hover:bg-surface-2',
  ghost: 'px-2 text-accent-text hover:underline underline-offset-4',
};

/** 44px minimum height on every variant keeps touch targets WCAG-friendly. */
export function buttonClasses(variant: ButtonVariant = 'primary', extra = ''): string {
  return `${BASE} ${VARIANTS[variant]} ${extra}`.trim();
}

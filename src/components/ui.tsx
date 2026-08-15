import { Link } from 'react-router-dom';
import type { ComponentProps, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-ink border-accent shadow-[0_4px_0_-1px_color-mix(in_oklab,var(--c-accent)_60%,black)] active:translate-y-[3px] active:shadow-none',
  secondary:
    'bg-surface text-ink border-line shadow-[0_3px_0_-1px_var(--c-line)] active:translate-y-[2px] active:shadow-none',
  ghost: 'bg-transparent text-ink border-transparent hover:bg-surface-2',
  danger: 'bg-transparent text-[var(--c-accent)] border-accent-line hover:bg-accent-soft',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'min-h-11 px-3 text-[15px]',
    md: 'min-h-12 px-4 text-[17px]',
    lg: 'min-h-16 px-5 text-xl',
  } as const;

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border-2 font-semibold transition-[transform,background-color] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none ${VARIANTS[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

export function LinkButton({
  to,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
}: {
  to: string;
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: ReactNode;
}) {
  const sizes = {
    sm: 'min-h-11 px-3 text-[15px]',
    md: 'min-h-12 px-4 text-[17px]',
    lg: 'min-h-14 px-5 text-lg',
  } as const;

  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border-2 text-center font-semibold no-underline transition-transform ${VARIANTS[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function Card({
  children,
  className = '',
  as: Tag = 'section',
}: {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'article';
}) {
  return (
    <Tag className={`rounded-3xl border-2 border-line bg-surface p-4 ${className}`}>{children}</Tag>
  );
}

export function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="scroll-mt-28 text-2xl font-semibold text-ink">
      {children}
    </h2>
  );
}

export function Callout({
  tone = 'accent',
  title,
  children,
}: {
  tone?: 'accent' | 'good' | 'warn';
  title?: ReactNode;
  children: ReactNode;
}) {
  const tones = {
    accent: 'border-accent-line bg-accent-soft',
    good: 'border-[var(--c-good)] bg-[var(--c-good-soft)]',
    warn: 'border-[var(--c-warn)] bg-[var(--c-warn-soft)]',
  } as const;

  return (
    <div className={`rounded-2xl border-2 p-3.5 ${tones[tone]}`}>
      {title ? <p className="mb-1 font-display text-lg font-semibold">{title}</p> : null}
      <div className="text-[15px] leading-relaxed">{children}</div>
    </div>
  );
}

export function Pill({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'accent' | 'good' | 'warn' }) {
  const tones = {
    muted: 'border-line bg-surface-2 text-muted',
    accent: 'border-accent-line bg-accent-soft text-ink',
    good: 'border-[var(--c-good)] bg-[var(--c-good-soft)] text-ink',
    warn: 'border-[var(--c-warn)] bg-[var(--c-warn-soft)] text-ink',
  } as const;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[13px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

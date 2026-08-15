import type { DieFace } from '../lib/rules';

const PIPS: Record<DieFace, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

export type DieState = 'idle' | 'selected' | 'held' | 'set-aside' | 'hint';

type DieProps = {
  face: DieFace;
  /** A pixel size, or 'fill' to stretch to the grid cell and stay square. */
  size?: number | 'fill';
  state?: DieState;
  rolling?: boolean;
  onClick?: () => void;
  /** Extra words for the accessible label, e.g. "kept from roll 2". */
  context?: string;
  disabled?: boolean;
};

const STATE_WORDS: Record<DieState, string> = {
  idle: 'not selected',
  selected: 'selected',
  held: 'held out of the next roll',
  'set-aside': 'set aside',
  hint: 'not selected, scores',
};

export function Die({
  face,
  size = 64,
  state = 'idle',
  rolling = false,
  onClick,
  context,
  disabled,
}: DieProps) {
  const pips = PIPS[face];

  const label = `Die showing ${face}, ${STATE_WORDS[state]}${context ? `, ${context}` : ''}`;

  const surface =
    state === 'selected' || state === 'held'
      ? 'bg-accent text-accent-ink border-accent'
      : 'bg-[var(--c-die)] border-[var(--c-die-edge)]';

  const lift =
    state === 'selected' || state === 'held'
      ? '-translate-y-1 shadow-[0_8px_0_-2px_color-mix(in_oklab,var(--c-accent)_55%,black)]'
      : 'shadow-[0_3px_0_-1px_color-mix(in_oklab,var(--c-die-edge)_80%,black)]';

  const hint = state === 'hint' ? 'ring-3 ring-dashed ring-[var(--c-good)] ring-offset-2 ring-offset-[var(--c-bg)]' : '';

  const pipColor =
    state === 'selected' || state === 'held' ? 'var(--c-accent-ink)' : 'var(--c-die-pip)';

  const inner = (
    <span
      aria-hidden="true"
      className="grid h-full w-full grid-cols-3 grid-rows-3 p-[14%]"
      style={{ gap: '4%' }}
    >
      {Array.from({ length: 9 }, (_, index) => (
        <span key={index} className="flex items-center justify-center">
          {pips.includes(index) ? (
            <span
              className="block rounded-full"
              style={{ width: '78%', aspectRatio: '1', background: pipColor }}
            />
          ) : null}
        </span>
      ))}
    </span>
  );

  const classes = [
    'relative inline-grid place-items-center rounded-[var(--radius-die)] border-2 transition-[transform,background-color,box-shadow] duration-150',
    surface,
    lift,
    hint,
    rolling ? 'die-rolling' : '',
    onClick && !disabled ? 'cursor-pointer active:translate-y-0 active:shadow-none' : '',
    disabled ? 'opacity-60' : '',
  ].join(' ');

  const style =
    size === 'fill' ? { width: '100%', aspectRatio: '1' } : { width: size, height: size };

  if (!onClick) {
    return (
      <span className={classes} style={style} role="img" aria-label={label}>
        {inner}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      style={style}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={state === 'selected' || state === 'held'}
      aria-label={label}
    >
      {inner}
      {state === 'selected' || state === 'held' ? (
        <span className="pointer-events-none absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-[var(--c-ink)] text-[11px] font-bold text-[var(--c-bg)]">
          ✓
        </span>
      ) : null}
    </button>
  );
}

/** Small inline die for prose and scoring tables. */
export function InlineDie({ face, size = 22 }: { face: DieFace; size?: number }) {
  return (
    <span className="inline-block align-[-0.3em]">
      <Die face={face} size={size} />
    </span>
  );
}

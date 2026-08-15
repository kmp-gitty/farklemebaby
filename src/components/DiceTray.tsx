import { Die, type DieState } from './Die';
import type { DieFace } from '../lib/rules';

/**
 * The 11-dice-on-a-375px-phone problem (§6.2). Columns are chosen so the tray
 * wraps into tidy rows and every die stays well over 44px, and the grid uses
 * minmax(0,1fr) so nothing overflows at 320px either.
 */
export function columnsFor(count: number): number {
  if (count <= 3) return Math.max(1, count);
  if (count === 4) return 2;
  if (count <= 6) return 3;
  if (count <= 9) return count === 9 ? 3 : 4;
  return 4;
}

function maxDieFor(count: number): number {
  if (count <= 3) return 108;
  if (count <= 6) return 96;
  return 82;
}

export type TrayDie = {
  face: DieFace;
  state?: DieState;
  onClick?: () => void;
  context?: string;
  disabled?: boolean;
};

export function DiceTray({
  dice,
  rolling = false,
  gap = 10,
  compact = false,
  label,
}: {
  dice: TrayDie[];
  rolling?: boolean;
  gap?: number;
  /** Smaller dice, for the set-aside tray where they're read, not tapped. */
  compact?: boolean;
  label?: string;
}) {
  const columns = compact ? Math.min(6, Math.max(1, dice.length)) : columnsFor(dice.length);
  const maxDie = compact ? 44 : maxDieFor(dice.length);

  return (
    <div
      className="mx-auto grid w-full justify-center"
      role="group"
      aria-label={label}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap,
        maxWidth: columns * maxDie + (columns - 1) * gap,
      }}
    >
      {dice.map((die, index) => (
        <Die
          key={index}
          face={die.face}
          size="fill"
          state={die.state}
          rolling={rolling}
          onClick={die.onClick}
          context={die.context}
          disabled={die.disabled}
        />
      ))}
    </div>
  );
}

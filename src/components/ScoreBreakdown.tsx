import type { DieFace } from '../lib/rules';
import { formatScore } from '../lib/game';
import type { ScoreResult } from '../lib/scoring';
import { Die } from './Die';

/**
 * A combination-by-combination readout. Deliberately not per-die: a 5 inside
 * three-of-a-kind isn't worth 50, so labelling individual dice would be a lie.
 */
export function ScoreBreakdown({ result, dead = [] }: { result: ScoreResult; dead?: DieFace[] }) {
  return (
    <div className="space-y-2">
      <ul className="flex flex-wrap gap-1.5">
        {result.breakdown.map((combo, index) => (
          <li
            key={index}
            className="flex items-center gap-1.5 rounded-xl border-2 border-line bg-surface px-2 py-1"
          >
            <span className="flex gap-0.5">
              {combo.dice.map((face, dieIndex) => (
                <Die key={dieIndex} face={face} size={20} />
              ))}
            </span>
            <span className="text-[14px] font-semibold">{combo.label}</span>
            <span className="tnum text-[14px] font-semibold text-muted">
              {formatScore(combo.points)}
            </span>
          </li>
        ))}
      </ul>

      {dead.length > 0 ? (
        <p className="flex flex-wrap items-center gap-1.5 text-[14px] text-muted">
          <span>Scoring nothing:</span>
          <span className="flex gap-0.5">
            {dead.map((face, index) => (
              <Die key={index} face={face} size={20} />
            ))}
          </span>
        </p>
      ) : null}
    </div>
  );
}

/** The dice in `held` that no combination in `result` accounts for. */
export function deadDice(held: DieFace[], result: ScoreResult): DieFace[] {
  const used = new Map<DieFace, number>();
  for (const combo of result.breakdown) {
    for (const face of combo.dice) used.set(face, (used.get(face) ?? 0) + 1);
  }
  const leftovers: DieFace[] = [];
  for (const face of held) {
    const remaining = used.get(face) ?? 0;
    if (remaining > 0) used.set(face, remaining - 1);
    else leftovers.push(face);
  }
  return leftovers;
}

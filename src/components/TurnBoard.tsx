import type { RuleSet } from '../lib/rules';
import { formatScore } from '../lib/game';
import { describeBreakdown, scoringDiceIndices } from '../lib/scoring';
import { bankableTotal, selectionScore, type TurnState } from '../lib/playTurn';
import { DiceTray } from './DiceTray';
import { Die } from './Die';
import { Callout, Pill } from './ui';

export function SetAsideTray({ turn }: { turn: TurnState }) {
  if (turn.setAside.length === 0) return null;

  return (
    <div className="rounded-2xl border-2 border-line bg-surface-2 p-3">
      <h2 className="mb-2 text-[13px] font-semibold text-muted uppercase">
        Set aside this turn
      </h2>
      <ol className="space-y-2">
        {turn.setAside.map((group, index) => (
          <li key={index} className="flex flex-wrap items-center gap-2">
            <Pill>Roll {group.rollNumber}</Pill>
            <span className="flex flex-wrap gap-1">
              {group.dice.map((face, dieIndex) => (
                <Die
                  key={dieIndex}
                  face={face}
                  size={30}
                  state="set-aside"
                  context={`kept from roll ${group.rollNumber}`}
                />
              ))}
            </span>
            <span className="tnum ml-auto font-semibold">{formatScore(group.points)}</span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-[13px] text-muted">
        Rolls are kept apart because combinations only count within one roll.
      </p>
    </div>
  );
}

export function RunningTotal({
  rules,
  turn,
  label = 'This turn',
}: {
  rules: RuleSet;
  turn: TurnState;
  label?: string;
}) {
  const total = bankableTotal(rules, turn);
  const farkled = turn.status === 'farkled';

  return (
    <div className="text-center">
      <p className="text-[13px] font-semibold text-muted uppercase">{label}</p>
      <p
        className={`tnum font-display text-6xl leading-none font-semibold ${
          farkled ? 'shake-out text-muted line-through' : ''
        }`}
      >
        {formatScore(farkled ? 0 : total)}
      </p>
    </div>
  );
}

export function ActiveDice({
  rules,
  turn,
  onToggle,
  hints,
  rolling,
}: {
  rules: RuleSet;
  turn: TurnState;
  onToggle: (index: number) => void;
  hints: boolean;
  rolling: boolean;
}) {
  const hinted = hints && turn.status === 'live' ? scoringDiceIndices(rules, turn.active) : [];

  return (
    <DiceTray
      label={`Dice on the table, roll ${turn.rollNumber}`}
      rolling={rolling}
      dice={turn.active.map((face, index) => ({
        face,
        state: turn.selected.includes(index) ? 'selected' : hinted.includes(index) ? 'hint' : 'idle',
        onClick: () => onToggle(index),
        context: turn.status === 'farkled' ? 'nothing scores' : 'tap to set it aside',
        disabled: turn.status === 'farkled',
      }))}
    />
  );
}

export function SelectionReadout({ rules, turn }: { rules: RuleSet; turn: TurnState }) {
  if (turn.status === 'farkled') return null;
  if (turn.selected.length === 0) {
    return (
      <p className="min-h-11 text-center text-[15px] text-muted">
        Tap the dice you're keeping. At least one, and every one has to score.
      </p>
    );
  }

  const result = selectionScore(rules, turn);
  if (result === null) {
    return (
      <p className="min-h-11 text-center text-[15px] font-semibold text-[var(--c-accent)]">
        That selection doesn't work — every die you keep has to be part of a scoring combination.
      </p>
    );
  }

  return (
    <p className="min-h-11 text-center text-[15px] font-semibold">
      {describeBreakdown(result)} — <span className="tnum">{formatScore(result.points)}</span>
    </p>
  );
}

export function HotDiceCallout({ rules }: { rules: RuleSet }) {
  return (
    <Callout tone="good" title="Hot dice!">
      Every die scored, so all {rules.diceCount} come back in the cup — and you keep the running
      total.
    </Callout>
  );
}

export function FarkleCallout({ lost }: { lost: number }) {
  return (
    <div role="status" className="pop-in rounded-2xl border-2 border-accent bg-accent-soft p-4 text-center">
      <p className="font-display text-2xl font-semibold">Farkle.</p>
      <p className="mt-1 text-[15px]">
        Nothing in that roll scores, so the {formatScore(lost)} you were carrying goes back in the
        box. Happens to everyone.
      </p>
    </div>
  );
}

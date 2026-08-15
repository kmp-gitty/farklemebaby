import { useCallback, useEffect, useRef, useState } from 'react';
import { useRuleSet } from '../context/RuleSetContext';
import { MAX_DICE, type DieFace } from '../lib/rules';
import { rollDice } from '../lib/dice';
import {
  bestPossible,
  describeBreakdown,
  isFarkle,
  scoreSelection,
  scoringDiceIndices,
} from '../lib/scoring';
import { usePersistentState } from '../lib/usePersistentState';
import { keys } from '../lib/storage';
import { DiceTray } from '../components/DiceTray';
import { ScoreBreakdown, deadDice } from '../components/ScoreBreakdown';
import { Button, Card, Pill } from '../components/ui';
import { formatScore } from '../lib/game';

type DiceState = {
  count: number;
  dice: DieFace[];
  held: number[];
  /** Indices thrown by the most recent roll — the ones a farkle is judged on. */
  lastRolled?: number[];
  history: DieFace[][];
  hints: boolean;
};

const ROLL_MS = 480;

export function DicePage() {
  const rules = useRuleSet();
  const [state, setState] = usePersistentState<DiceState>(keys.dice(rules.storagePrefix), () => ({
    count: rules.diceCount,
    dice: [],
    held: [],
    history: [],
    hints: false,
  }));
  const [rolling, setRolling] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const timer = useRef<number | undefined>(undefined);

  const roll = useCallback(() => {
    setRolling(true);
    setState((current) => {
      const next: DieFace[] = [];
      const rolled: number[] = [];
      for (let index = 0; index < current.count; index++) {
        const heldFace = current.held.includes(index) ? current.dice[index] : undefined;
        if (heldFace === undefined) rolled.push(index);
        next.push(heldFace ?? rollDice(1)[0]);
      }
      return {
        ...current,
        dice: next,
        // Whether it's a farkle depends on the dice that were actually thrown,
        // not on what's held now — so remember them rather than recomputing
        // from the current holds, which the player can change afterwards.
        lastRolled: rolled,
        history: [next, ...current.history].slice(0, 10),
      };
    });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setRolling(false), ROLL_MS);
  }, [setState]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (rolling || state.dice.length === 0) return;
    const thrown = (state.lastRolled ?? state.dice.map((_, index) => index))
      .map((index) => state.dice[index])
      .filter(Boolean);
    const nothing = state.hints && thrown.length > 0 && isFarkle(rules, thrown);
    setAnnouncement(`Rolled ${state.dice.join(', ')}${nothing ? ' — nothing scores. Farkle.' : ''}`);
  }, [rolling, rules, state.dice, state.hints, state.lastRolled]);

  const toggleHold = (index: number) => {
    setState((current) => ({
      ...current,
      held: current.held.includes(index)
        ? current.held.filter((held) => held !== index)
        : [...current.held, index],
    }));
  };

  const setCount = (count: number) => {
    setState((current) => ({
      ...current,
      count,
      held: current.held.filter((index) => index < count),
      dice: current.dice.slice(0, count),
    }));
  };

  const reset = () =>
    setState((current) => ({ ...current, dice: [], held: [], history: [] }));

  const best = state.hints && state.dice.length > 0 ? bestPossible(rules, state.dice) : null;
  const hinted = state.hints && state.dice.length > 0 ? scoringDiceIndices(rules, state.dice) : [];

  const heldFaces = state.held.map((index) => state.dice[index]).filter(Boolean);
  // Score the held dice as a set. If they don't all belong to a combination,
  // fall back to the best reading and name the ones carrying nothing.
  const heldExact = heldFaces.length > 0 ? scoreSelection(rules, heldFaces) : null;
  const heldResult = heldExact ?? (heldFaces.length > 0 ? bestPossible(rules, heldFaces) : null);
  const heldDead = heldResult ? deadDice(heldFaces, heldResult) : [];

  const holdScoringDice = () => {
    setState((current) => ({ ...current, held: scoringDiceIndices(rules, current.dice) }));
  };

  // A farkle is about the dice that were just thrown. With nothing held that's
  // the whole roll; with dice held it's only the rest — which is exactly the
  // case the tile used to miss, because the held dice still had a score.
  const thrownFaces = (state.lastRolled ?? state.dice.map((_, index) => index))
    .map((index) => state.dice[index])
    .filter(Boolean);
  const farkled = thrownFaces.length > 0 && isFarkle(rules, thrownFaces);

  useShakeToRoll(roll);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl font-semibold">Dice</h1>
        <p className="text-muted">
          Lost the dice, still have the score pad. No scoring, no game state — just a cup.
        </p>
      </header>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-semibold">How many dice?</span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCount(Math.max(1, state.count - 1))}
              disabled={state.count <= 1}
              aria-label="One fewer die"
            >
              −
            </Button>
            <span className="tnum min-w-10 text-center font-display text-2xl font-semibold">
              {state.count}
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCount(Math.min(MAX_DICE, state.count + 1))}
              disabled={state.count >= MAX_DICE}
              aria-label="One more die"
            >
              +
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: MAX_DICE }, (_, index) => index + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCount(n)}
              aria-pressed={state.count === n}
              className={`tnum min-h-11 min-w-11 rounded-xl border-2 font-semibold ${
                state.count === n
                  ? 'border-accent bg-accent text-accent-ink'
                  : 'border-line bg-surface-2 text-muted'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <p className="text-[14px] text-muted">
          {rules.name} rolls {rules.diceCount}. Change it freely — this page doesn't care.
        </p>
      </Card>

      <div className="min-h-[180px]">
        {state.dice.length === 0 ? (
          <Card className="grid min-h-[180px] place-items-center text-center text-muted">
            <p>Tap Roll to throw {state.count} {state.count === 1 ? 'die' : 'dice'}.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            <DiceTray
              label="Dice"
              rolling={rolling}
              dice={state.dice.map((face, index) => ({
                face,
                state: state.held.includes(index) ? 'held' : hinted.includes(index) ? 'hint' : 'idle',
                onClick: () => toggleHold(index),
                context: 'tap to hold it out of the next roll',
              }))}
            />
            <p className="text-center text-[14px] text-muted">
              {state.held.length > 0
                ? `${state.held.length} held out of the next roll`
                : 'Tap a die to hold it'}
            </p>
          </div>
        )}
      </div>

      {state.hints && state.dice.length > 0 ? (
        <Card className="space-y-3">
          {farkled ? (
            <div
              role="status"
              className="pop-in rounded-2xl border-2 border-accent bg-accent-soft p-3.5 text-center"
            >
              <h2 className="font-display text-2xl font-semibold">Farkle.</h2>
              <p className="mt-1 text-[15px]">
                {state.held.length > 0
                  ? 'Nothing in the dice you just threw scores. In a game the turn would end here and everything set aside this turn would be lost.'
                  : `Nothing in that roll scores under ${rules.name}. In a game the turn would end here.`}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="font-display text-xl font-semibold">
              {heldResult ? 'Holding' : 'Best available'}
            </h2>
            <span
              className="tnum ml-auto font-display text-3xl font-semibold"
              aria-live="polite"
              aria-label={`${heldResult ? 'Held dice score' : 'Best available score'}: ${formatScore(
                (heldResult ?? best)?.points ?? 0,
              )}`}
            >
              {formatScore((heldResult ?? best)?.points ?? 0)}
            </span>
          </div>

          {heldResult ? (
            <>
              <ScoreBreakdown result={heldResult} dead={heldDead} />
              {best && best.points > heldResult.points ? (
                <p className="text-[14px] text-muted">
                  The whole roll is worth {formatScore(best.points)} — {describeBreakdown(best)}.
                </p>
              ) : null}
            </>
          ) : best && best.points > 0 ? (
            <ScoreBreakdown result={best} />
          ) : farkled ? null : (
            <p className="text-[15px] text-muted">Nothing here scores under {rules.name}.</p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={holdScoringDice}
              disabled={!best || best.points === 0}
            >
              Hold everything that scores
            </Button>
            {state.held.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setState((current) => ({ ...current, held: [] }))}
              >
                Release all
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      {!state.hints && state.held.length > 0 ? (
        <p className="text-center text-[14px] text-muted">
          Turn on scoring help below to see what you're holding.
        </p>
      ) : null}

      <div className="sticky bottom-[calc(80px+env(safe-area-inset-bottom))] z-10 md:static">
        <Button size="lg" className="w-full" onClick={roll}>
          {state.dice.length === 0 ? 'Roll' : state.held.length > 0 ? 'Roll the rest' : 'Roll again'}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-h-11 items-center gap-2 rounded-2xl border-2 border-line bg-surface px-3">
          <input
            type="checkbox"
            className="h-5 w-5 accent-[var(--c-accent)]"
            checked={state.hints}
            onChange={(event) =>
              setState((current) => ({ ...current, hints: event.target.checked }))
            }
          />
          <span className="text-[15px] font-semibold">Scoring help</span>
        </label>
        <Button variant="secondary" size="sm" onClick={reset} disabled={state.dice.length === 0}>
          Clear
        </Button>
      </div>

      {state.history.length > 0 ? (
        <Card>
          <h2 className="mb-2 font-display text-xl font-semibold">This session's rolls</h2>
          <ol className="space-y-1.5">
            {state.history.map((roll, index) => (
              <li key={index} className="flex items-center gap-2 text-[15px]">
                <Pill>{index === 0 ? 'latest' : `${index + 1} back`}</Pill>
                <span className="tnum tracking-wide">{roll.join('  ')}</span>
              </li>
            ))}
          </ol>
        </Card>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

/** Shake to roll, where the device offers it. Never required (§6.4). */
function useShakeToRoll(onShake: () => void) {
  const callback = useRef(onShake);
  callback.current = onShake;

  useEffect(() => {
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return;
    // iOS needs an explicit permission prompt we deliberately don't ask for;
    // when permission was granted elsewhere the listener just works.
    const needsPermission =
      typeof (DeviceMotionEvent as unknown as { requestPermission?: unknown }).requestPermission ===
      'function';
    if (needsPermission) return;

    let last = 0;
    const handler = (event: DeviceMotionEvent) => {
      const a = event.accelerationIncludingGravity;
      if (!a) return;
      const force = Math.abs(a.x ?? 0) + Math.abs(a.y ?? 0) + Math.abs(a.z ?? 0);
      const now = Date.now();
      if (force > 38 && now - last > 900) {
        last = now;
        callback.current();
      }
    };
    window.addEventListener('devicemotion', handler);
    return () => window.removeEventListener('devicemotion', handler);
  }, []);
}

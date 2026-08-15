import { useState } from 'react';
import type { DieFace, RuleSet } from '../lib/rules';
import { formatScore } from '../lib/game';
import { WALKTHROUGHS } from '../lib/walkthroughs';
import {
  bank,
  bankableTotal,
  canCommit,
  rollOn,
  startTurn,
  toggleDie,
  type TurnState,
} from '../lib/playTurn';
import { Button, Callout, Card } from './ui';
import {
  ActiveDice,
  FarkleCallout,
  HotDiceCallout,
  RunningTotal,
  SelectionReadout,
  SetAsideTray,
} from './TurnBoard';

/**
 * A real solo turn with a coach layer, in whichever rule set you're in. The
 * dice are scripted so the round can reach hot dice and a farkle on purpose —
 * §6.2 says that's the one place fixed dice are acceptable, as long as we say so.
 */
export function Walkthrough({ rules, onExit }: { rules: RuleSet; onExit: () => void }) {
  const script = WALKTHROUGHS[rules.id];
  const [turn, setTurn] = useState<TurnState>(() =>
    startTurn(rules, () => script.rolls[0] as DieFace[]),
  );
  const [ended, setEnded] = useState<null | { reason: 'banked' | 'farkled'; points: number }>(null);

  const step = script.coach[turn.rollNumber];
  const valid = canCommit(rules, turn);

  const advance = () => {
    const next = rollOn(rules, turn, (count) => {
      // If the player deviates from the suggested selection the scripted roll
      // won't fit, so trim it rather than throwing the round away.
      const scripted = script.rolls[turn.rollNumber] ?? [];
      return (scripted.length === count ? scripted : scripted.slice(0, count)) as DieFace[];
    });
    if (!next) return;
    setTurn(next);
    if (next.status === 'farkled') setEnded({ reason: 'farkled', points: 0 });
  };

  const takeTheMoney = () => {
    const banked = bank(rules, turn);
    if (!banked) return;
    setTurn(banked.turn);
    setEnded({ reason: 'banked', points: banked.points });
  };

  const lastCoachStep = script.coach[Object.keys(script.coach).length];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl font-semibold">Guided round</h1>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={onExit}>
          Exit walkthrough
        </Button>
      </div>

      <Callout tone="warn" title="We've stacked the dice for this demo">
        These rolls are scripted so the round can show you hot dice and a farkle on purpose. Real
        games roll honestly. You're being taught <strong>{rules.name}</strong> — {rules.diceCount}{' '}
        dice.
      </Callout>

      {step && !ended ? (
        <Card className="border-accent-line bg-accent-soft">
          <p className="text-[16px] leading-relaxed">{step.before}</p>
        </Card>
      ) : null}

      <SetAsideTray turn={turn} />
      {turn.hotDice && turn.status === 'live' ? <HotDiceCallout rules={rules} /> : null}
      <RunningTotal rules={rules} turn={turn} />
      {turn.status === 'farkled' ? <FarkleCallout lost={turn.runningTotal} /> : null}

      <ActiveDice
        rules={rules}
        turn={turn}
        onToggle={(dieIndex) => setTurn(toggleDie(turn, dieIndex))}
        hints
        rolling={false}
      />

      <SelectionReadout rules={rules} turn={turn} />

      {ended ? (
        <Card className="space-y-3">
          <h2 className="font-display text-xl font-semibold">
            {ended.reason === 'banked'
              ? `You banked ${formatScore(ended.points)}.`
              : 'Turn over — farkle.'}
          </h2>
          <p className="text-[15px]">
            {ended.reason === 'banked'
              ? 'Exactly right: taking a good total off the table is how games are won. Roll after roll, the odds catch up with everyone.'
              : lastCoachStep?.after}
          </p>
          {ended.reason === 'banked' ? (
            <Callout tone="warn" title="The farkle you just dodged">
              Those last dice were scripted to come up {script.finalRollWords} — no 1, no 5, no
              triplet. Nothing scores, so the whole {formatScore(ended.points)} would have gone back
              in the box.
            </Callout>
          ) : null}
          <p className="text-[15px] text-muted">
            That's the whole game: set aside, decide, repeat. First to{' '}
            {formatScore(rules.targetScore)} banked points starts the final round.
          </p>
          <Button size="lg" className="w-full" onClick={onExit}>
            Start a real game
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button size="lg" variant="secondary" onClick={advance} disabled={!valid}>
            Roll again
          </Button>
          <Button size="lg" onClick={takeTheMoney} disabled={!valid}>
            Bank {valid ? formatScore(bankableTotal(rules, turn)) : ''}
          </Button>
        </div>
      )}

      {turn.rollNumber > 1 && !ended && script.coach[turn.rollNumber - 1]?.after ? (
        <p className="text-center text-[15px] text-muted">
          {script.coach[turn.rollNumber - 1].after}
        </p>
      ) : null}
    </div>
  );
}

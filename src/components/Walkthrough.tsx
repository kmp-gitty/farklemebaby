import { useState } from 'react';
import { STANDARD, type DieFace, type RuleSet } from '../lib/rules';
import { formatScore } from '../lib/game';
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
 * A real solo turn with a coach layer. The dice are scripted so the round can
 * reach hot dice and a farkle on purpose — §6.2 says that's the one place fixed
 * dice are acceptable, as long as we say so.
 */
const SCRIPT: number[][] = [
  [1, 5, 2, 3, 4, 6], // roll 1 — two scoring dice, take only one
  [4, 4, 4, 1, 5], // roll 2 — everything scores → hot dice
  [3, 3, 3, 2, 4, 6], // roll 3 — the bank-or-roll decision
  [2, 3, 4], // roll 4 — farkle
];

const COACH: Record<number, { before: string; after?: string }> = {
  1: {
    before:
      'Six dice. Only the 1 and the 5 score here — the 2, 3, 4 and 6 are dead. Tap the 1 to set it aside. You could take the 5 as well, but leaving it means five dice to reroll instead of four, and that is often the better bet.',
    after: 'That 1 is worth 100, and it is safe for as long as you keep rolling.',
  },
  2: {
    before:
      'Triple 4s is 400, the 1 is another 100 and the 5 is 50. Take all five — every die on the table scores, which is worth doing here.',
    after:
      'All six dice have now been set aside, so you get the whole cup back and keep the 650. That is hot dice.',
  },
  3: {
    before:
      'Triple 3s would put you on 950 for the turn. This is the real Farkle decision: bank 950 now, or set the 3s aside and roll the last three dice for more.',
    after: 'Rolling on with three dice. Anything that scores keeps the turn alive.',
  },
  4: {
    before: 'Nothing here scores.',
    after:
      'That is a farkle: 2, 3 and 4 with no 1 and no 5. The entire 950 is gone and the turn is over. Banking at 950 would have been the safe call — knowing when to stop is the whole game.',
  },
};

export function Walkthrough({ rules, onExit }: { rules: RuleSet; onExit: () => void }) {
  // The guided round teaches Standard; Jane's is the same flow, different scoring.
  const teaching = STANDARD;
  const [turn, setTurn] = useState<TurnState>(() => startTurn(teaching, () => SCRIPT[0] as DieFace[]));
  const [ended, setEnded] = useState<null | { reason: 'banked' | 'farkled'; points: number }>(null);

  const step = COACH[turn.rollNumber];
  const valid = canCommit(teaching, turn);

  const advance = () => {
    const next = rollOn(teaching, turn, (count) => {
      const scripted = SCRIPT[turn.rollNumber] ?? [];
      return (scripted.length === count ? scripted : scripted.slice(0, count)) as DieFace[];
    });
    if (!next) return;
    setTurn(next);
    if (next.status === 'farkled') setEnded({ reason: 'farkled', points: 0 });
  };

  const takeTheMoney = () => {
    const banked = bank(teaching, turn);
    if (!banked) return;
    setTurn(banked.turn);
    setEnded({ reason: 'banked', points: banked.points });
  };

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
        games roll honestly.
        {rules.id === 'janes' ? (
          <>
            {' '}
            The guided round teaches <strong>Standard</strong> (6 dice) — Jane's turn works exactly
            the same way, she just scores differently.
          </>
        ) : null}
      </Callout>

      {step && !ended ? (
        <Card className="border-accent-line bg-accent-soft">
          <p className="text-[16px] leading-relaxed">{step.before}</p>
        </Card>
      ) : null}

      <SetAsideTray turn={turn} />
      {turn.hotDice && turn.status === 'live' ? <HotDiceCallout rules={teaching} /> : null}
      <RunningTotal rules={teaching} turn={turn} />
      {turn.status === 'farkled' ? <FarkleCallout lost={turn.runningTotal} /> : null}

      <ActiveDice
        rules={teaching}
        turn={turn}
        onToggle={(dieIndex) => setTurn(toggleDie(turn, dieIndex))}
        hints
        rolling={false}
      />

      <SelectionReadout rules={teaching} turn={turn} />

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
              : COACH[4].after}
          </p>
          {ended.reason === 'banked' ? (
            <Callout tone="warn" title="The farkle you just dodged">
              Those last three dice were scripted to come up 2, 3, 4 — no 1, no 5, no triple.
              Nothing scores, so the whole {formatScore(ended.points)} would have gone back in the
              box. That's a farkle.
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
            Bank {valid ? formatScore(bankableTotal(teaching, turn)) : ''}
          </Button>
        </div>
      )}

      {turn.rollNumber > 1 && !ended && COACH[turn.rollNumber - 1]?.after ? (
        <p className="text-center text-[15px] text-muted">{COACH[turn.rollNumber - 1].after}</p>
      ) : null}
    </div>
  );
}

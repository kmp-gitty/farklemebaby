import { useRuleSet } from '../context/RuleSetContext';
import { formatScore } from '../lib/game';
import type { DieFace } from '../lib/rules';
import { Die } from '../components/Die';
import { ScoringTable } from '../components/ScoringTable';
import { Callout, Card, LinkButton, SectionTitle } from '../components/ui';

const SAMPLE: Array<{ roll: string; dice: DieFace[]; kept: DieFace[]; gained: number; total: number; note: string }> = [
  {
    roll: 'Roll 1 — six dice',
    dice: [5, 2, 3, 4, 6, 2],
    kept: [5],
    gained: 50,
    total: 50,
    note: 'Only the 5 scores. Set it aside and roll the other five.',
  },
  {
    roll: 'Roll 2 — five dice',
    dice: [1, 4, 4, 4, 2],
    kept: [1, 4, 4, 4],
    gained: 500,
    total: 550,
    note: 'A 1 (100) and three 4s (400). One die left on the table.',
  },
  {
    roll: 'Roll 3 — one die',
    dice: [1],
    kept: [1],
    gained: 100,
    total: 650,
    note: 'A 1. That is all six dice set aside — hot dice, so roll all six again.',
  },
  {
    roll: 'Roll 4 — six dice again',
    dice: [3, 3, 3, 2, 4, 6],
    kept: [3, 3, 3],
    gained: 300,
    total: 950,
    note: 'Three 3s. Bank the 950 rather than push three dice for more.',
  },
];

export function RulesPage() {
  const rules = useRuleSet();

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="font-display text-4xl font-semibold">Farkle</h1>
        <p className="text-lg">
          Roll six dice, keep what scores, and decide every single roll whether to bank your points
          or push your luck. First to {formatScore(rules.targetScore)} wins.
        </p>
        <div className="grid grid-cols-3 gap-2">
          <LinkButton to="/play">Play</LinkButton>
          <LinkButton to="/score" variant="secondary">
            Score Pad
          </LinkButton>
          <LinkButton to="/dice" variant="secondary">
            Dice
          </LinkButton>
        </div>
      </header>

      <section className="space-y-3">
        <SectionTitle id="scoring">Scoring</SectionTitle>
        <Card>
          <ScoringTable rules={rules} />
        </Card>
        <Callout title="The three that catch people out">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Four, five or six of a kind is a flat value <em>regardless of the number</em>. Four 2s
              and four 6s are both 1,000 — and four 1s is 1,000, not 400.
            </li>
            <li>
              The straight, three pairs, four-plus-a-pair and two triplets each use all six dice, so
              they only happen on a six-dice roll.
            </li>
            <li>Only 1s and 5s score on their own. A lone 2, 3, 4 or 6 is worth nothing.</li>
          </ul>
        </Callout>
      </section>

      <section className="space-y-3">
        <SectionTitle id="turn">How a turn works</SectionTitle>
        <ol className="space-y-2">
          {[
            'Roll all six dice.',
            'Set aside at least one scoring die. You may set aside fewer than all of them — leaving a scoring die on the table to reroll it is legal, and sometimes smart.',
            'Every die you set aside has to be part of a scoring combination. No riding along.',
            'Roll the dice that are left, or bank and end your turn.',
          ].map((text, index) => (
            <li key={index} className="flex gap-3 rounded-2xl border-2 border-line bg-surface p-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent font-bold text-accent-ink">
                {index + 1}
              </span>
              <span className="text-[16px]">{text}</span>
            </li>
          ))}
        </ol>

        <Callout tone="good" title="Hot dice">
          Set all six dice aside and you roll all six again, keeping the running total. There is no
          limit to how many times this can happen in one turn.
        </Callout>

        <Callout tone="warn" title="Farkle">
          If a roll produces no scoring dice at all, the turn ends immediately and everything you had
          running that turn is lost. Banked points are safe forever.
        </Callout>
      </section>

      <section className="space-y-3">
        <SectionTitle id="board">Getting on the board, and winning</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <h3 className="font-display text-lg font-semibold">
              {formatScore(rules.entryThreshold)} to start
            </h3>
            <p className="mt-1 text-[15px]">
              You have to bank {formatScore(rules.entryThreshold)} or more <em>in a single turn</em>{' '}
              to get on the board. Until then your score stays at 0 and short turns are simply lost.
              Once you're on, you can bank any amount.
            </p>
          </Card>
          <Card>
            <h3 className="font-display text-lg font-semibold">
              {formatScore(rules.targetScore)} to win
            </h3>
            <p className="mt-1 text-[15px]">
              When someone's banked score reaches {formatScore(rules.targetScore)}, everyone else
              gets exactly one more turn. Highest score after that round wins — and a tie at the top
              is a shared win.
            </p>
          </Card>
        </div>
        <p className="text-[15px] text-muted">
          Highest single die goes first, play passes left. Dice that roll off the table are rerolled.
          A game runs about 30 minutes.
        </p>
      </section>

      <section className="space-y-3">
        <SectionTitle id="example">A turn, start to finish</SectionTitle>
        <p className="text-[16px]">
          This is the worked example from the rules card. It is the fastest way to understand hot
          dice.
        </p>
        <ol className="space-y-3">
          {SAMPLE.map((step, index) => (
            <li key={index}>
              <Card className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-display text-lg font-semibold">{step.roll}</h3>
                  <span className="tnum ml-auto text-[15px] font-semibold text-muted">
                    +{formatScore(step.gained)} → {formatScore(step.total)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {step.dice.map((face, dieIndex) => {
                    // Mark the dice this step keeps, left to right.
                    const keptCount = step.kept.filter((k) => k === face).length;
                    const usedBefore = step.dice
                      .slice(0, dieIndex)
                      .filter((f) => f === face).length;
                    const kept = usedBefore < keptCount;
                    return (
                      <Die
                        key={dieIndex}
                        face={face}
                        size={38}
                        state={kept ? 'selected' : 'idle'}
                        context={kept ? 'set aside' : 'left on the table'}
                      />
                    );
                  })}
                </div>
                <p className="text-[15px] text-muted">{step.note}</p>
              </Card>
            </li>
          ))}
        </ol>
        <Callout tone="good" title="Banked: 950">
          Four rolls, one round trip through hot dice, and a decision to stop. That is the whole
          game.
        </Callout>
      </section>

      <section className="space-y-3">
        <SectionTitle>Elsewhere on this site</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="space-y-2">
            <h3 className="font-display text-lg font-semibold">Jane's Rules</h3>
            <p className="text-[15px]">
              The house variant this site was built for: 11 dice, triplets and single 1s and 5s only,
              and three 1s is worth 1,000.
            </p>
            <LinkButton to="/janes" variant="secondary" size="sm">
              Read Jane's Rules
            </LinkButton>
          </Card>
          <Card className="space-y-2">
            <h3 className="font-display text-lg font-semibold">Where Farkle came from</h3>
            <p className="text-[15px]">
              Nobody invented it. It's a folk game — which is exactly why your rules and your
              cousin's rules disagree.
            </p>
            <LinkButton to="/history" variant="secondary" size="sm">
              Read the history
            </LinkButton>
          </Card>
        </div>
      </section>
    </div>
  );
}

import { useRuleSet } from '../context/RuleSetContext';
import { formatScore } from '../lib/game';
import { farkleImpossibleAt } from '../lib/scoring';
import { ScoringTable } from '../components/ScoringTable';
import { Callout, Card, LinkButton, SectionTitle } from '../components/ui';
import { DiceTray } from '../components/DiceTray';
import type { DieFace } from '../lib/rules';

const DIFFERENCES = [
  {
    title: 'Eleven dice, not six',
    body: 'Every roll starts with 11 dice. Turns run longer, totals run higher, and hot dice comes around a lot.',
  },
  {
    title: 'Three 1s is 1,000',
    body: 'Up from 300. It is the single biggest change, and it is why getting on the board is rarely a problem.',
  },
  {
    title: 'Only three things score',
    body: 'Triplets, single 1s (100) and single 5s (50). That is the entire scoring system.',
  },
  {
    title: 'Everything else is gone',
    body: 'No four-, five- or six-of-a-kind. No 1–6 straight. No three pairs. No four-plus-a-pair. No two-triplet bonus. A fourth matching die is simply a dead die.',
  },
  {
    title: 'Every other rule is unchanged',
    body: 'Set aside at least one scoring die per roll, combinations only count within a single roll, hot dice returns all 11, a farkle wipes the turn, 500 to get on the board, 10,000 to win with a final round for everyone else.',
  },
];

const ELEVEN: DieFace[] = [1, 1, 1, 2, 2, 2, 3, 4, 5, 6, 6];

export function JanesPage() {
  const rules = useRuleSet();
  const threshold = farkleImpossibleAt(rules) ?? 9;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="font-display text-4xl font-semibold">Jane's Rules</h1>
        <p className="text-lg">
          Eleven dice. Triplets, single 1s and single 5s — and nothing else. Three 1s is worth 1,000.
        </p>
        <div className="grid grid-cols-3 gap-2">
          <LinkButton to="/janes/play">Play</LinkButton>
          <LinkButton to="/janes/score" variant="secondary">
            Score Pad
          </LinkButton>
          <LinkButton to="/janes/dice" variant="secondary">
            Dice
          </LinkButton>
        </div>
      </header>

      <Card className="space-y-2">
        <h2 className="font-display text-xl font-semibold">Who's Jane?</h2>
        <p className="text-[16px]">
          My mother-in-law. She's the one who taught me Farkle, and it took a while to work out that
          the version she taught isn't the version printed on the box you can buy in a shop. Hers
          uses eleven dice, throws out most of the special combinations, and pays a thousand for
          three 1s.
        </p>
        <p className="text-[16px]">
          Neither version is wrong. Farkle is a folk game — it was passed hand to hand for
          generations before anyone sold it in a box, and every table that plays it bends it a
          little. Jane's table bent it more than most, so it gets its own half of this site.
        </p>
      </Card>

      <section className="space-y-3">
        <SectionTitle>What's different</SectionTitle>
        <ol className="space-y-2">
          {DIFFERENCES.map((difference, index) => (
            <li key={index} className="flex gap-3 rounded-2xl border-2 border-line bg-surface p-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent font-bold text-accent-ink">
                {index + 1}
              </span>
              <span>
                <strong className="font-display text-lg">{difference.title}</strong>
                <span className="mt-0.5 block text-[15px]">{difference.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <SectionTitle id="scoring">Jane's scoring</SectionTitle>
        <Card>
          <ScoringTable rules={rules} />
        </Card>
        <Callout title="Multiple triplets score independently">
          <p>
            Each triplet is scored on its own, at face value. There's no bonus for two of them — and
            no penalty either.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Six 2s in one roll is 400.</li>
            <li>Three 3s and three 6s in one roll is 900.</li>
            <li>Six 1s in one roll is 2,000.</li>
          </ul>
          <p className="mt-2">
            And nothing carries between rolls: two 5s now and one 5 next roll is 150, never 500.
          </p>
        </Callout>
      </section>

      <section className="space-y-3">
        <SectionTitle>You cannot farkle {threshold} dice or more</SectionTitle>
        <Card className="space-y-3">
          <DiceTray label="An eleven dice roll" dice={ELEVEN.map((face) => ({ face }))} />
          <p className="text-[16px]">
            To farkle you need no 1s and no 5s, which leaves every die showing a 2, 3, 4 or 6 — four
            values. Put {threshold} dice into four values and at least one value has to appear three
            times. That's a triplet, and a triplet always scores.
          </p>
          <p className="text-[16px]">
            So the opening roll of 11 can <em>never</em> farkle, and neither can a reroll of 10 or 9.
            Farkles only become possible once you're down to 8 dice or fewer. The risk in Jane's game
            arrives late in the turn, never at the start of it.
          </p>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionTitle>Play Jane's way</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="space-y-2">
            <h3 className="font-display text-lg font-semibold">Play</h3>
            <p className="text-[15px]">Eleven dice on screen, pass the phone round.</p>
            <LinkButton to="/janes/play" size="sm">
              Open
            </LinkButton>
          </Card>
          <Card className="space-y-2">
            <h3 className="font-display text-lg font-semibold">Score Pad</h3>
            <p className="text-[15px]">Real dice on the table, scores in here.</p>
            <LinkButton to="/janes/score" variant="secondary" size="sm">
              Open
            </LinkButton>
          </Card>
          <Card className="space-y-2">
            <h3 className="font-display text-lg font-semibold">Dice</h3>
            <p className="text-[15px]">Eleven dice, no scoring, no opinions.</p>
            <LinkButton to="/janes/dice" variant="secondary" size="sm">
              Open
            </LinkButton>
          </Card>
        </div>
        <p className="text-[15px] text-muted">
          {formatScore(rules.entryThreshold)} to get on the board and {formatScore(rules.targetScore)}{' '}
          to win, same as Standard — though with 1,000 for three 1s, getting on the board is close to
          automatic.
        </p>
      </section>

      <Card className="space-y-2">
        <h3 className="font-display text-lg font-semibold">Playing the standard game instead?</h3>
        <p className="text-[15px]">
          Standard Farkle uses 6 dice and adds straights, three pairs, four-plus-a-pair and the
          n-of-a-kind bonuses — and three 1s is only 300 there.
        </p>
        <LinkButton to="/" variant="secondary" size="sm">
          Standard rules
        </LinkButton>
      </Card>
    </div>
  );
}

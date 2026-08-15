import { FACES, type DieFace, type RuleSet } from './rules';

export type ComboKind =
  | 'single'
  | 'triplet'
  | 'four'
  | 'five'
  | 'six'
  | 'straight'
  | 'threePairs'
  | 'fourPlusPair'
  | 'twoTriplets';

export type Combo = {
  kind: ComboKind;
  /** The dice this combination consumes, as faces. */
  dice: DieFace[];
  points: number;
  label: string;
};

export type ScoreResult = {
  points: number;
  breakdown: Combo[];
};

type Counts = number[]; // length 7, index 1..6 used

const ORDINAL = ['', 'one', 'two', 'three', 'four', 'five', 'six'];

function facePlural(face: DieFace, n: number): string {
  return n === 1 ? `${face}` : `${face}s`;
}

function toCounts(dice: readonly number[]): Counts {
  const counts: Counts = [0, 0, 0, 0, 0, 0, 0];
  for (const die of dice) {
    if (!Number.isInteger(die) || die < 1 || die > 6) {
      throw new Error(`Invalid die face: ${String(die)}`);
    }
    counts[die] += 1;
  }
  return counts;
}

function total(counts: Counts): number {
  return counts[1] + counts[2] + counts[3] + counts[4] + counts[5] + counts[6];
}

function repeat(face: DieFace, n: number): DieFace[] {
  return Array.from({ length: n }, () => face);
}

/**
 * Every combination the rule set allows to be removed from `counts` right now.
 * Order is irrelevant to correctness — the search takes the maximum — but a
 * roughly-descending order makes the memo hit good branches sooner.
 */
function availableCombos(rules: RuleSet, counts: Counts): Combo[] {
  const combos: Combo[] = [];

  const specials = rules.specials;
  if (specials) {
    if (FACES.every((f) => counts[f] >= 1)) {
      combos.push({
        kind: 'straight',
        dice: [...FACES],
        points: specials.straight,
        label: '1–6 straight',
      });
    }

    // Three pairs. A face with four of a kind supplies two pairs, six supplies
    // three — which is why faces may repeat here.
    for (let a = 1; a <= 6; a++) {
      for (let b = a; b <= 6; b++) {
        for (let c = b; c <= 6; c++) {
          const need: Counts = [0, 0, 0, 0, 0, 0, 0];
          need[a] += 2;
          need[b] += 2;
          need[c] += 2;
          if (FACES.every((f) => counts[f] >= need[f])) {
            const dice: DieFace[] = [a as DieFace, a as DieFace, b as DieFace, b as DieFace, c as DieFace, c as DieFace];
            combos.push({
              kind: 'threePairs',
              dice,
              points: specials.threePairs,
              label: 'Three pairs',
            });
          }
        }
      }
    }

    for (const a of FACES) {
      if (counts[a] < 4) continue;
      for (const b of FACES) {
        if (b === a || counts[b] < 2) continue;
        combos.push({
          kind: 'fourPlusPair',
          dice: [...repeat(a, 4), ...repeat(b, 2)],
          points: specials.fourPlusPair,
          label: `Four ${facePlural(a, 4)} + a pair of ${facePlural(b, 2)}`,
        });
      }
    }

    for (const a of FACES) {
      for (const b of FACES) {
        if (b < a) continue;
        if (a === b ? counts[a] < 6 : counts[a] < 3 || counts[b] < 3) continue;
        combos.push({
          kind: 'twoTriplets',
          dice: [...repeat(a, 3), ...repeat(b, 3)],
          points: specials.twoTriplets,
          label: `Two triplets (${a}s and ${b}s)`,
        });
      }
    }
  }

  const multiples = rules.multiples;
  if (multiples) {
    for (const face of FACES) {
      if (counts[face] >= 6) {
        combos.push({
          kind: 'six',
          dice: repeat(face, 6),
          points: multiples.six,
          label: `Six ${facePlural(face, 6)}`,
        });
      }
      if (counts[face] >= 5) {
        combos.push({
          kind: 'five',
          dice: repeat(face, 5),
          points: multiples.five,
          label: `Five ${facePlural(face, 5)}`,
        });
      }
      if (counts[face] >= 4) {
        combos.push({
          kind: 'four',
          dice: repeat(face, 4),
          points: multiples.four,
          label: `Four ${facePlural(face, 4)}`,
        });
      }
    }
  }

  for (const face of FACES) {
    if (counts[face] >= 3) {
      combos.push({
        kind: 'triplet',
        dice: repeat(face, 3),
        points: rules.triplets[face],
        label: `Three ${facePlural(face, 3)}`,
      });
    }
  }

  for (const face of FACES) {
    const value = rules.singles[face];
    if (value === undefined || counts[face] < 1) continue;
    combos.push({
      kind: 'single',
      dice: [face],
      points: value,
      label: `Single ${face}`,
    });
  }

  return combos;
}

/** Higher points wins; on a tie prefer the reading with fewer, bigger combos. */
function better(a: ScoreResult, b: ScoreResult): ScoreResult {
  if (b.points > a.points) return b;
  if (b.points === a.points && b.breakdown.length < a.breakdown.length) return b;
  return a;
}

const memo = new Map<string, ScoreResult | null>();

function search(rules: RuleSet, counts: Counts, allowPartial: boolean): ScoreResult | null {
  const remaining = total(counts);
  if (remaining === 0) return { points: 0, breakdown: [] };

  const key = `${rules.id}|${allowPartial ? 'p' : 'x'}|${counts[1]},${counts[2]},${counts[3]},${counts[4]},${counts[5]},${counts[6]}`;
  const cached = memo.get(key);
  if (cached !== undefined) return cached;

  // Guard against a cycle before recursing (there is none — every combo
  // strictly shrinks the pool — but the memo write must land regardless).
  let best: ScoreResult | null = allowPartial ? { points: 0, breakdown: [] } : null;

  for (const combo of availableCombos(rules, counts)) {
    const rest = counts.slice();
    for (const die of combo.dice) rest[die] -= 1;
    const sub = search(rules, rest, allowPartial);
    if (sub === null) continue;
    const candidate: ScoreResult = {
      points: combo.points + sub.points,
      breakdown: [combo, ...sub.breakdown],
    };
    best = best === null ? candidate : better(best, candidate);
  }

  memo.set(key, best);
  return best;
}

/**
 * Best possible score for a set of dice, assuming EVERY die must be used.
 * Returns null if the dice cannot all be used in scoring combinations.
 */
export function scoreSelection(rules: RuleSet, dice: readonly number[]): ScoreResult | null {
  return search(rules, toCounts(dice), false);
}

/** Best score available from any subset of the dice — used for hints, never to auto-play. */
export function bestPossible(rules: RuleSet, dice: readonly number[]): ScoreResult {
  return search(rules, toCounts(dice), true) ?? { points: 0, breakdown: [] };
}

/** Does this roll contain ANY scoring combination? (i.e. is it not a Farkle?) */
export function hasAnyScore(rules: RuleSet, dice: readonly number[]): boolean {
  return bestPossible(rules, dice).points > 0;
}

export function isFarkle(rules: RuleSet, dice: readonly number[]): boolean {
  return !hasAnyScore(rules, dice);
}

/**
 * Indices of the dice used by the best-available scoring reading. Drives the
 * optional "highlight scoring dice" toggle; it never selects them for you.
 */
export function scoringDiceIndices(rules: RuleSet, dice: readonly number[]): number[] {
  const needed = toCounts(bestPossible(rules, dice).breakdown.flatMap((c) => c.dice));
  const indices: number[] = [];
  dice.forEach((die, index) => {
    if (needed[die] > 0) {
      needed[die] -= 1;
      indices.push(index);
    }
  });
  return indices;
}

/** "Two triplets — 2,500" style summary for the selection readout. */
export function describeBreakdown(result: ScoreResult): string {
  if (result.breakdown.length === 0) return 'Nothing selected';
  const counted = new Map<string, number>();
  for (const combo of result.breakdown) {
    counted.set(combo.label, (counted.get(combo.label) ?? 0) + 1);
  }
  return [...counted]
    .map(([label, n]) => (n === 1 ? label : `${ORDINAL[n] ?? n}× ${label}`))
    .join(' + ');
}

/** Exposed for tests and for the /janes fun fact. */
export function farkleImpossibleAt(rules: RuleSet): number | null {
  const nonScoringFaces = FACES.filter((f) => rules.singles[f] === undefined);
  if (nonScoringFaces.length === 0 || rules.specials) return null;
  // With only non-scoring faces in play, the pigeonhole principle forces a
  // triplet once you roll 2×(number of dead faces) + 1 dice.
  return 2 * nonScoringFaces.length + 1;
}

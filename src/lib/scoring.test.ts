import { describe, expect, it } from 'vitest';
import { JANES, STANDARD } from './rules';
import {
  bestPossible,
  farkleImpossibleAt,
  hasAnyScore,
  scoreSelection,
  scoringDiceIndices,
} from './scoring';

const INVALID = 'invalid' as const;

function score(rules: typeof STANDARD, dice: number[]): number | typeof INVALID {
  const result = scoreSelection(rules, dice);
  return result === null ? INVALID : result.points;
}

describe('scoreSelection — Standard rules (§5.3)', () => {
  const cases: Array<[number[], number | typeof INVALID, string]> = [
    [[1], 100, 'baseline'],
    [[5], 50, 'baseline'],
    [[1, 5], 150, 'two singles'],
    [[3], INVALID, 'non-scoring die cannot be set aside'],
    [[1, 3], INVALID, 'partial selection must still be fully valid'],
    [[1, 1, 1], 300, 'triple 1s beat 3×100'],
    [[2, 2, 2], 200, 'the one triple worth less than 300'],
    [[1, 1, 1, 1], 1000, 'four of a kind, not 300+100'],
    [[1, 1, 1, 1, 1], 2000, 'five of a kind'],
    [[1, 1, 1, 1, 1, 1], 3000, 'six of a kind'],
    [[4, 4, 4, 4, 4, 1], 2100, 'five of a kind + a single 1'],
    [[4, 4, 4, 4, 4, 5], 2050, 'five of a kind + a single 5'],
    [[3, 3, 3, 3, 6, 6], 1500, 'four+pair beats 1,000 + nothing'],
    [[1, 1, 1, 1, 5, 5], 1500, 'four+pair beats 1,000 + 100'],
    [[2, 2, 2, 3, 3, 3], 2500, 'two triplets beats 200 + 300'],
    [[1, 1, 1, 5, 5, 5], 2500, 'two triplets beats 300 + 500'],
    [[1, 2, 3, 4, 5, 6], 1500, 'straight beats 100 + 50'],
    [[2, 2, 3, 3, 4, 4], 1500, 'three pairs of otherwise dead dice'],
    [[1, 1, 5, 5, 3, 3], 1500, 'three pairs beats 100+100+50+50'],
    [[2, 2, 2, 2, 2, 2], 3000, 'six of a kind beats reading it as three pairs'],
    [[1, 1, 1, 2, 2, 2], 2500, 'two triplets including 1s'],
    [[2, 2, 3, 3, 4, 6], INVALID, 'near-miss on three pairs'],
  ];

  it.each(cases)('%j → %s (%s)', (dice, expected) => {
    expect(score(STANDARD, dice)).toBe(expected);
  });
});

describe('hasAnyScore — Standard rules (§5.3)', () => {
  const cases: Array<[number[], boolean]> = [
    [[2, 3, 4, 6, 2, 3], true],
    [[2, 2, 3, 3, 4, 6], true],
    [[2, 2, 3, 3, 4, 4], false],
    [[2, 3, 4, 6], true],
    [[2, 2, 2, 3], false],
  ];

  it.each(cases)('%j → farkle: %s', (dice, isFarkleExpected) => {
    expect(hasAnyScore(STANDARD, dice)).toBe(!isFarkleExpected);
  });
});

describe("scoreSelection — Jane's rules (§5.3b)", () => {
  const cases: Array<[number[], number | typeof INVALID, string]> = [
    [[1], 100, 'singles unchanged'],
    [[5], 50, 'singles unchanged'],
    [[1, 1, 1], 1000, "Jane's headline change"],
    [[1, 1, 1, 1], 1100, 'triplet + leftover single'],
    [[1, 1, 1, 1, 1, 1], 2000, 'two triplets of 1s, no bonus'],
    [[5, 5, 5], 500, 'same as standard'],
    [[5, 5, 5, 5], 550, 'triplet + leftover single'],
    [[2, 2, 2], 200, 'other triplets unchanged'],
    [[2, 2, 2, 2], INVALID, "no four-of-a-kind; 4th die can't be set aside"],
    [[2, 2, 2, 2, 2, 2], 400, 'two triplets at face value, no bonus'],
    [[1, 1, 1, 5, 5, 5], 1500, '1,000 + 500 — no two-triplet bonus'],
    // §5.3b lists this as 150, but that is the best *available* score, not a
    // legal full selection: setting aside the 2, 3, 4 and 6 breaks §5.2, the
    // same way [3,3,3,3,6,6] does. Strict reading wins; see bestPossible below.
    [[1, 2, 3, 4, 5, 6], INVALID, 'no straight; the 2/3/4/6 cannot be set aside'],
    [[1, 5], 150, 'no straight; only the 1 and the 5 score'],
    [[2, 2, 3, 3, 4, 4], INVALID, 'no three pairs'],
    [[3, 3, 3, 3, 6, 6], INVALID, "no four+pair, and the 6s don't score"],
    [[3, 3, 3, 6, 6, 6], 900, 'two independent triplets'],
  ];

  it.each(cases)('%j → %s (%s)', (dice, expected) => {
    expect(score(JANES, dice)).toBe(expected);
  });
});

describe("hasAnyScore — Jane's rules (§5.3b)", () => {
  const cases: Array<[number[], boolean]> = [
    [[2, 2, 3, 3, 4, 6], true],
    [[2, 2, 2, 3, 3, 4], false],
    [[2, 2, 3, 3, 4, 4, 6, 6], true],
  ];

  it.each(cases)('%j → farkle: %s', (dice, isFarkleExpected) => {
    expect(hasAnyScore(JANES, dice)).toBe(!isFarkleExpected);
  });

  it('is mathematically impossible to farkle 9, 10 or 11 dice (§6.5)', () => {
    expect(farkleImpossibleAt(JANES)).toBe(9);
    for (const count of [9, 10, 11]) {
      for (const dice of everyRoll(count)) {
        expect(hasAnyScore(JANES, dice), `${dice.join(',')} should score`).toBe(true);
      }
    }
  });
});

describe('bestPossible', () => {
  it('takes the best subset, not the whole roll', () => {
    expect(bestPossible(STANDARD, [1, 3, 3, 4, 6, 2]).points).toBe(100);
    expect(bestPossible(JANES, [2, 2, 2, 2, 6, 6]).points).toBe(200);
    // §5.3b's "[1,2,3,4,5,6] → 150" under Jane's rules, read as best-available.
    expect(bestPossible(JANES, [1, 2, 3, 4, 5, 6]).points).toBe(150);
  });

  it('returns zero on a farkle', () => {
    expect(bestPossible(STANDARD, [2, 3, 4, 6, 2, 3]).points).toBe(0);
  });

  it('never scores across the boundary of a single roll', () => {
    // Two 5s now and one 5 later is 150, never 500 (§6.5).
    expect(bestPossible(JANES, [5, 5]).points + bestPossible(JANES, [5]).points).toBe(150);
    expect(bestPossible(JANES, [5, 5, 5]).points).toBe(500);
  });
});

describe('scoringDiceIndices', () => {
  it('points at the dice behind the best reading', () => {
    expect(scoringDiceIndices(STANDARD, [3, 1, 4, 4, 6, 2])).toEqual([1]);
    // a straight uses every die
    expect(scoringDiceIndices(STANDARD, [3, 1, 4, 5, 6, 2])).toEqual([0, 1, 2, 3, 4, 5]);
    expect(scoringDiceIndices(JANES, [2, 3, 2, 3, 3, 4])).toEqual([1, 3, 4]);
  });
});

describe('exhaustive sanity', () => {
  it('agrees that a valid full selection never beats the best subset', () => {
    for (const dice of everyRoll(6)) {
      const exact = scoreSelection(STANDARD, dice);
      if (exact) expect(bestPossible(STANDARD, dice).points).toBeGreaterThanOrEqual(exact.points);
    }
  });

  it('breakdown dice always add up to the selection', () => {
    for (const dice of everyRoll(5)) {
      const exact = scoreSelection(JANES, dice);
      if (!exact) continue;
      const used = exact.breakdown.flatMap((combo) => combo.dice).sort();
      expect(used).toEqual([...dice].sort());
    }
  });
});

/** Every non-decreasing roll of `n` dice — enough to cover every count vector. */
function everyRoll(n: number): number[][] {
  const rolls: number[][] = [];
  const build = (start: number, current: number[]) => {
    if (current.length === n) {
      rolls.push([...current]);
      return;
    }
    for (let face = start; face <= 6; face++) {
      current.push(face);
      build(face, current);
      current.pop();
    }
  };
  build(1, []);
  return rolls;
}

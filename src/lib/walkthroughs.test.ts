import { describe, expect, it } from 'vitest';
import { JANES, STANDARD, type DieFace, type RuleSet } from './rules';
import { WALKTHROUGHS } from './walkthroughs';
import { bankableTotal, rollOn, selectionScore, startTurn, toggleDie, type TurnState } from './playTurn';

function scriptedRoller(rules: RuleSet) {
  const { rolls } = WALKTHROUGHS[rules.id];
  return (rollNumber: number) => () => rolls[rollNumber] as DieFace[];
}

function select(turn: TurnState, indices: number[]): TurnState {
  return indices.reduce((current, index) => toggleDie(current, index), turn);
}

/**
 * The coach tells the player exactly what to tap, so the numbers it quotes have
 * to be the numbers the engine produces. These tests are the proof.
 */
describe('the Standard guided round', () => {
  it('reaches 950, hot dice and a farkle exactly as the coach says', () => {
    const roll = scriptedRoller(STANDARD);
    let turn = startTurn(STANDARD, roll(0));
    expect(turn.active).toHaveLength(6);
    expect(turn.status).toBe('live');

    // Roll 1: take only the 1, leaving the 5 on the table.
    turn = select(turn, [0]);
    expect(selectionScore(STANDARD, turn)?.points).toBe(100);
    turn = rollOn(STANDARD, turn, roll(1))!;
    expect(turn.runningTotal).toBe(100);
    expect(turn.active).toHaveLength(5);

    // Roll 2: everything scores — triple 4s, a 1 and a 5.
    turn = select(turn, [0, 1, 2, 3, 4]);
    expect(selectionScore(STANDARD, turn)?.points).toBe(550);
    turn = rollOn(STANDARD, turn, roll(2))!;
    expect(turn.hotDice).toBe(true);
    expect(turn.runningTotal).toBe(650);
    expect(turn.active).toHaveLength(6);

    // Roll 3: triple 3s puts the coached total at 950.
    turn = select(turn, [0, 1, 2]);
    expect(bankableTotal(STANDARD, turn)).toBe(950);
    turn = rollOn(STANDARD, turn, roll(3))!;
    expect(turn.active).toHaveLength(3);
    expect(turn.status).toBe('farkled');
  });
});

describe("the Jane's guided round", () => {
  it('reaches 3,900, hot dice and a farkle exactly as the coach says', () => {
    const roll = scriptedRoller(JANES);
    let turn = startTurn(JANES, roll(0));
    expect(turn.active).toHaveLength(11);
    expect(turn.status).toBe('live');

    // Roll 1: three 1s and the 5, deliberately leaving the triple 2s behind.
    turn = select(turn, [0, 1, 2, 3]);
    expect(selectionScore(JANES, turn)?.points).toBe(1050);
    turn = rollOn(JANES, turn, roll(1))!;
    expect(turn.runningTotal).toBe(1050);
    expect(turn.active).toHaveLength(7);

    // Roll 2: all seven score, so the whole cup comes back.
    turn = select(turn, [0, 1, 2, 3, 4, 5, 6]);
    expect(selectionScore(JANES, turn)?.points).toBe(1550);
    turn = rollOn(JANES, turn, roll(2))!;
    expect(turn.hotDice).toBe(true);
    expect(turn.runningTotal).toBe(2600);
    expect(turn.active).toHaveLength(11);

    // Roll 3: three triplets, scored independently at face value.
    turn = select(turn, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(selectionScore(JANES, turn)?.points).toBe(1300);
    expect(bankableTotal(JANES, turn)).toBe(3900);
    turn = rollOn(JANES, turn, roll(3))!;
    expect(turn.active).toHaveLength(2);
    expect(turn.status).toBe('farkled');
  });

  it('only farkles once the round is down past eight dice', () => {
    const { rolls } = WALKTHROUGHS.janes;
    const farkleRoll = rolls.at(-1)!;
    expect(farkleRoll.length).toBeLessThanOrEqual(8);
  });
});

describe('every script', () => {
  it.each([STANDARD, JANES])('$name has a coach step per roll', (rules) => {
    const script = WALKTHROUGHS[rules.id];
    expect(Object.keys(script.coach)).toHaveLength(script.rolls.length);
    expect(script.rolls[0]).toHaveLength(rules.diceCount);
    expect(script.coach[script.rolls.length].after).toBeTruthy();
  });
});

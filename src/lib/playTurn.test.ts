import { describe, expect, it } from 'vitest';
import { JANES, STANDARD } from './rules';
import type { DieFace } from './rules';
import { bank, canCommit, rollOn, selectionScore, startTurn, toggleDie } from './playTurn';

/** A roller that hands out a scripted sequence, like the walkthrough uses. */
function scripted(sequence: number[][]) {
  let index = 0;
  return (count: number): DieFace[] => {
    const next = sequence[index] ?? [];
    index += 1;
    if (next.length !== count) {
      throw new Error(`scripted roll ${index} has ${next.length} dice, expected ${count}`);
    }
    return next as DieFace[];
  };
}

function select(turn: ReturnType<typeof startTurn>, indices: number[]) {
  return indices.reduce((current, index) => toggleDie(current, index), turn);
}

describe('a turn', () => {
  it('walks the rules-card example: 50 → 550 → 650 → hot dice → bank 950', () => {
    const roll = scripted([
      [5, 2, 3, 4, 6, 2], // roll 1 — take the single 5
      [1, 4, 4, 4, 2], // roll 2 — take the 1 and triple 4s
      [1], // roll 3 — take the 1, all six used
      [3, 3, 3, 2, 4, 6], // roll 4 — hot dice, take triple 3s
    ]);

    let turn = startTurn(STANDARD, roll);
    expect(turn.status).toBe('live');

    turn = select(turn, [0]);
    expect(selectionScore(STANDARD, turn)?.points).toBe(50);
    turn = rollOn(STANDARD, turn, roll)!;
    expect(turn.runningTotal).toBe(50);
    expect(turn.active).toHaveLength(5);

    turn = select(turn, [0, 1, 2, 3]);
    expect(selectionScore(STANDARD, turn)?.points).toBe(500);
    turn = rollOn(STANDARD, turn, roll)!;
    expect(turn.runningTotal).toBe(550);
    expect(turn.active).toHaveLength(1);

    turn = select(turn, [0]);
    turn = rollOn(STANDARD, turn, roll)!;
    expect(turn.hotDice).toBe(true);
    expect(turn.runningTotal).toBe(650);
    expect(turn.active).toHaveLength(6);

    turn = select(turn, [0, 1, 2]);
    const banked = bank(STANDARD, turn)!;
    expect(banked.points).toBe(950);
    expect(banked.turn.setAside.map((group) => group.rollNumber)).toEqual([1, 2, 3, 4]);
  });

  it('refuses a selection that includes a dead die', () => {
    const roll = scripted([[1, 3, 3, 4, 6, 2]]);
    let turn = startTurn(STANDARD, roll);
    turn = select(turn, [0, 1]);
    expect(selectionScore(STANDARD, turn)).toBeNull();
    expect(canCommit(STANDARD, turn)).toBe(false);
    expect(rollOn(STANDARD, turn, roll)).toBeNull();
  });

  it('lets a player leave a scoring die on the table', () => {
    const roll = scripted([
      [1, 5, 2, 3, 4, 6],
      [5, 2, 3, 4, 6], // rerolled the 5 with the rest
    ]);
    let turn = startTurn(STANDARD, roll);
    turn = select(turn, [0]); // just the 1, leaving the 5
    turn = rollOn(STANDARD, turn, roll)!;
    expect(turn.runningTotal).toBe(100);
    expect(turn.active).toHaveLength(5);
  });

  it('ends the turn on a farkle and the running total is not bankable', () => {
    const roll = scripted([
      [1, 1, 2, 3, 4, 6],
      [2, 3, 4, 6], // nothing
    ]);
    let turn = startTurn(STANDARD, roll);
    turn = select(turn, [0, 1]);
    turn = rollOn(STANDARD, turn, roll)!;
    expect(turn.status).toBe('farkled');
    expect(canCommit(STANDARD, turn)).toBe(false);
  });

  it("cannot farkle Jane's opening roll of 11 dice", () => {
    for (let attempt = 0; attempt < 300; attempt++) {
      expect(startTurn(JANES).status).toBe('live');
    }
  });

  it("returns all 11 dice on Jane's hot dice", () => {
    const roll = scripted([
      [1, 1, 1, 2, 2, 2, 3, 3, 3, 5, 5],
      [1, 1, 1, 2, 2, 2, 3, 3, 3, 5, 5],
    ]);
    let turn = startTurn(JANES, roll);
    turn = select(turn, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(selectionScore(JANES, turn)?.points).toBe(1000 + 200 + 300 + 50 + 50);
    turn = rollOn(JANES, turn, roll)!;
    expect(turn.hotDice).toBe(true);
    expect(turn.active).toHaveLength(11);
    expect(turn.runningTotal).toBe(1600);
  });
});

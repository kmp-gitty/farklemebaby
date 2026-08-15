import { rollDice } from './dice';
import type { DieFace, RuleSet } from './rules';
import { hasAnyScore, scoreSelection, type ScoreResult } from './scoring';

export type Roller = (count: number) => DieFace[];

export type SetAsideGroup = {
  /** Which roll of this turn these dice came from — kept visible so the
   *  "no combining across rolls" rule stays obvious (§6.5). */
  rollNumber: number;
  dice: DieFace[];
  points: number;
};

export type TurnState = {
  rollNumber: number;
  active: DieFace[];
  selected: number[];
  setAside: SetAsideGroup[];
  /** Points locked in from previous rolls this turn. Lost on a farkle. */
  runningTotal: number;
  status: 'live' | 'farkled';
  /** The last roll came after clearing every die. */
  hotDice: boolean;
};

export function startTurn(rules: RuleSet, roll: Roller = rollDice): TurnState {
  const active = roll(rules.diceCount);
  return {
    rollNumber: 1,
    active,
    selected: [],
    setAside: [],
    runningTotal: 0,
    status: hasAnyScore(rules, active) ? 'live' : 'farkled',
    hotDice: false,
  };
}

export function selectionFaces(turn: TurnState): DieFace[] {
  return turn.selected.map((index) => turn.active[index]).filter(Boolean);
}

export function selectionScore(rules: RuleSet, turn: TurnState): ScoreResult | null {
  if (turn.selected.length === 0) return { points: 0, breakdown: [] };
  return scoreSelection(rules, selectionFaces(turn));
}

export function toggleDie(turn: TurnState, index: number): TurnState {
  if (turn.status !== 'live') return turn;
  return {
    ...turn,
    selected: turn.selected.includes(index)
      ? turn.selected.filter((selected) => selected !== index)
      : [...turn.selected, index],
  };
}

export function clearSelection(turn: TurnState): TurnState {
  return { ...turn, selected: [] };
}

/** True when the selection is legal and worth banking or rolling on. */
export function canCommit(rules: RuleSet, turn: TurnState): boolean {
  if (turn.status !== 'live' || turn.selected.length === 0) return false;
  return selectionScore(rules, turn) !== null;
}

function commit(rules: RuleSet, turn: TurnState): TurnState | null {
  const result = selectionScore(rules, turn);
  if (result === null || turn.selected.length === 0) return null;

  const kept = new Set(turn.selected);
  return {
    ...turn,
    active: turn.active.filter((_, index) => !kept.has(index)),
    selected: [],
    setAside: [...turn.setAside, { rollNumber: turn.rollNumber, dice: selectionFaces(turn), points: result.points }],
    runningTotal: turn.runningTotal + result.points,
  };
}

/**
 * Set the selection aside and roll on. All dice used means hot dice: the whole
 * cup comes back and the running total carries (§4.2.5).
 */
export function rollOn(rules: RuleSet, turn: TurnState, roll: Roller = rollDice): TurnState | null {
  const committed = commit(rules, turn);
  if (!committed) return null;

  const hotDice = committed.active.length === 0;
  const nextCount = hotDice ? rules.diceCount : committed.active.length;
  const active = roll(nextCount);

  return {
    ...committed,
    rollNumber: committed.rollNumber + 1,
    active,
    hotDice,
    status: hasAnyScore(rules, active) ? 'live' : 'farkled',
  };
}

/** Points the player would take to the bank if they stopped right now. */
export function bankableTotal(rules: RuleSet, turn: TurnState): number {
  if (turn.status === 'farkled') return 0;
  const result = selectionScore(rules, turn);
  return turn.runningTotal + (result?.points ?? 0);
}

/** Set the selection aside and end the turn. Returns the points to bank. */
export function bank(rules: RuleSet, turn: TurnState): { turn: TurnState; points: number } | null {
  const committed = commit(rules, turn);
  if (!committed) return null;
  return { turn: committed, points: committed.runningTotal };
}

export function totalDiceInPlay(turn: TurnState): number {
  return turn.active.length;
}

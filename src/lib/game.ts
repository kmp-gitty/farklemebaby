import type { RuleSet } from './rules';

export type TurnOutcome = 'banked' | 'farkle' | 'below-threshold';

export type TurnRecord = {
  /** Global turn sequence across the whole game, 1-based. */
  turnNumber: number;
  /** Points accumulated during the turn. */
  runningTotal: number;
  /** What actually landed in bankedTotal (0 on a farkle or a sub-threshold turn). */
  banked: number;
  outcome: TurnOutcome;
  /** bankedTotal AFTER this turn — always recorded. */
  totalAfter: number;
};

export type Player = {
  id: string;
  name: string;
  bankedTotal: number;
  onTheBoard: boolean;
  turns: TurnRecord[];
};

export type GameState = {
  ruleSetId: RuleSet['id'];
  players: Player[];
  activeIndex: number;
  /** Next global turn number to be recorded. */
  nextTurnNumber: number;
};

export type TurnInput = {
  points: number;
  farkle?: boolean;
  /** House-rule override for the entry threshold (§6.3). */
  overrideThreshold?: boolean;
};

export type Endgame = {
  /** True once someone has crossed the target and the final round is running. */
  active: boolean;
  over: boolean;
  /** Player who crossed the target first. */
  triggeredBy: Player | null;
  /** Players who still owe their one final turn, in turn order. */
  remaining: Player[];
  /** Set only when over. More than one means a shared win (§4.4). */
  winners: Player[];
};

export type Standing = {
  player: Player;
  rank: number;
  gapToLeader: number;
  isLeader: boolean;
  isActive: boolean;
};

let idCounter = 0;
function makeId(): string {
  idCounter += 1;
  return `p${idCounter.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function createPlayer(name: string): Player {
  return { id: makeId(), name: name.trim() || 'Player', bankedTotal: 0, onTheBoard: false, turns: [] };
}

export function createGame(rules: RuleSet, names: string[]): GameState {
  return {
    ruleSetId: rules.id,
    players: names.map(createPlayer),
    activeIndex: 0,
    nextTurnNumber: 1,
  };
}

export function activePlayer(state: GameState): Player | undefined {
  return state.players[state.activeIndex];
}

/**
 * Resolve the active player's turn: bank it, discard it as a farkle, or reject
 * it as below the entry threshold — then hand play on. Pure.
 */
export function resolveTurn(rules: RuleSet, state: GameState, input: TurnInput): GameState {
  const endgame = getEndgame(rules, state);
  if (endgame.over) return state;

  const player = state.players[state.activeIndex];
  if (!player) return state;

  const points = Math.max(0, Math.round(input.points));
  const farkled = input.farkle === true || points === 0;
  const blocked =
    !farkled && !player.onTheBoard && points < rules.entryThreshold && input.overrideThreshold !== true;

  const outcome: TurnOutcome = farkled ? 'farkle' : blocked ? 'below-threshold' : 'banked';
  const banked = outcome === 'banked' ? points : 0;
  const totalAfter = player.bankedTotal + banked;

  const record: TurnRecord = {
    turnNumber: state.nextTurnNumber,
    runningTotal: points,
    banked,
    outcome,
    totalAfter,
  };

  const players = state.players.map((p, index) =>
    index === state.activeIndex
      ? {
          ...p,
          bankedTotal: totalAfter,
          onTheBoard: p.onTheBoard || outcome === 'banked',
          turns: [...p.turns, record],
        }
      : p,
  );

  return {
    ...state,
    players,
    activeIndex: (state.activeIndex + 1) % players.length,
    nextTurnNumber: state.nextTurnNumber + 1,
  };
}

/** Reverse the most recent turn and hand play back to whoever took it (§5.5.6). */
export function undoLastTurn(state: GameState): GameState {
  let lastIndex = -1;
  let lastTurn = -1;
  state.players.forEach((player, index) => {
    const turn = player.turns.at(-1);
    if (turn && turn.turnNumber > lastTurn) {
      lastTurn = turn.turnNumber;
      lastIndex = index;
    }
  });
  if (lastIndex === -1) return state;

  const players = state.players.map((player, index) => {
    if (index !== lastIndex) return player;
    const turns = player.turns.slice(0, -1);
    return {
      ...player,
      turns,
      bankedTotal: turns.at(-1)?.totalAfter ?? 0,
      onTheBoard: turns.some((turn) => turn.outcome === 'banked'),
    };
  });

  return { ...state, players, activeIndex: lastIndex, nextTurnNumber: lastTurn };
}

export function canUndo(state: GameState): boolean {
  return state.players.some((player) => player.turns.length > 0);
}

/**
 * Endgame is derived from turn history rather than stored, so undo can never
 * leave a stale "final round" flag behind.
 */
export function getEndgame(rules: RuleSet, state: GameState): Endgame {
  let triggerTurn = Infinity;
  let triggerIndex = -1;

  state.players.forEach((player, index) => {
    for (const turn of player.turns) {
      if (turn.totalAfter >= rules.targetScore && turn.turnNumber < triggerTurn) {
        triggerTurn = turn.turnNumber;
        triggerIndex = index;
      }
    }
  });

  if (triggerIndex === -1) {
    return { active: false, over: false, triggeredBy: null, remaining: [], winners: [] };
  }

  // Everyone else gets exactly one more turn, in turn order starting after the
  // player who crossed the line.
  const count = state.players.length;
  const remaining: Player[] = [];
  for (let step = 1; step < count; step++) {
    const player = state.players[(triggerIndex + step) % count];
    const hadFinalTurn = player.turns.some((turn) => turn.turnNumber > triggerTurn);
    if (!hadFinalTurn) remaining.push(player);
  }

  const over = remaining.length === 0;
  const best = Math.max(...state.players.map((player) => player.bankedTotal));
  return {
    active: true,
    over,
    triggeredBy: state.players[triggerIndex] ?? null,
    remaining,
    winners: over ? state.players.filter((player) => player.bankedTotal === best) : [],
  };
}

/** Always-current standings — the thing people look at between turns (§5.5.4). */
export function getStandings(state: GameState): Standing[] {
  const leaderScore = Math.max(0, ...state.players.map((player) => player.bankedTotal));
  const sorted = [...state.players].sort((a, b) => b.bankedTotal - a.bankedTotal);

  let rank = 0;
  let previousScore = Number.NaN;
  return sorted.map((player, index) => {
    if (player.bankedTotal !== previousScore) {
      rank = index + 1;
      previousScore = player.bankedTotal;
    }
    return {
      player,
      rank,
      gapToLeader: leaderScore - player.bankedTotal,
      isLeader: player.bankedTotal === leaderScore && leaderScore > 0,
      isActive: state.players[state.activeIndex]?.id === player.id,
    };
  });
}

export function renamePlayer(state: GameState, id: string, name: string): GameState {
  return {
    ...state,
    players: state.players.map((player) =>
      player.id === id ? { ...player, name: name.trim() || player.name } : player,
    ),
  };
}

export function pointsToGetOnBoard(rules: RuleSet, player: Player): number {
  return player.onTheBoard ? 0 : rules.entryThreshold;
}

export function formatScore(points: number): string {
  return points.toLocaleString('en-US');
}

/** "Marcus banks 550 → 3,150." — the line the score pad shows after a turn. */
export function describeTurn(rules: RuleSet, player: Player, turn: TurnRecord): string {
  switch (turn.outcome) {
    case 'farkle':
      return `${player.name} farkled — no points.`;
    case 'below-threshold':
      return `${player.name} scored ${formatScore(turn.runningTotal)}, but needs ${formatScore(
        rules.entryThreshold,
      )} in one turn to get on the board. Nothing banked.`;
    default:
      return `${player.name} banks ${formatScore(turn.banked)} → ${formatScore(turn.totalAfter)}.`;
  }
}

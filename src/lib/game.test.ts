import { describe, expect, it } from 'vitest';
import { JANES, STANDARD } from './rules';
import {
  canUndo,
  createGame,
  getEndgame,
  getStandings,
  renamePlayer,
  resolveTurn,
  undoLastTurn,
  type GameState,
} from './game';

function play(state: GameState, points: number[], rules = STANDARD): GameState {
  return points.reduce((current, value) => resolveTurn(rules, current, { points: value }), state);
}

describe('banking and the entry threshold', () => {
  it('blocks a first turn under 500 and says so', () => {
    const game = createGame(STANDARD, ['Jane', 'Marcus']);
    const after = resolveTurn(STANDARD, game, { points: 350 });
    const turn = after.players[0].turns[0];
    expect(turn.outcome).toBe('below-threshold');
    expect(turn.banked).toBe(0);
    expect(turn.totalAfter).toBe(0);
    expect(after.players[0].onTheBoard).toBe(false);
    expect(after.activeIndex).toBe(1);
  });

  it('lets any amount through once on the board', () => {
    let game = createGame(STANDARD, ['Jane']);
    game = resolveTurn(STANDARD, game, { points: 500 });
    game = resolveTurn(STANDARD, game, { points: 50 });
    expect(game.players[0].bankedTotal).toBe(550);
    expect(game.players[0].onTheBoard).toBe(true);
  });

  it('honours the house-rule override in the score pad (§6.3)', () => {
    const game = createGame(STANDARD, ['Jane']);
    const after = resolveTurn(STANDARD, game, { points: 300, overrideThreshold: true });
    expect(after.players[0].bankedTotal).toBe(300);
    expect(after.players[0].onTheBoard).toBe(true);
  });

  it('records a farkle as a zero turn and keeps the banked total', () => {
    let game = createGame(STANDARD, ['Jane']);
    game = resolveTurn(STANDARD, game, { points: 700 });
    game = resolveTurn(STANDARD, game, { points: 0, farkle: true });
    expect(game.players[0].bankedTotal).toBe(700);
    expect(game.players[0].turns.at(-1)).toMatchObject({ outcome: 'farkle', banked: 0, totalAfter: 700 });
  });

  it('records the total after every turn, for every player', () => {
    let game = createGame(STANDARD, ['Jane', 'Marcus']);
    game = play(game, [500, 600, 200, 150]);
    expect(game.players[0].turns.map((t) => t.totalAfter)).toEqual([500, 700]);
    expect(game.players[1].turns.map((t) => t.totalAfter)).toEqual([600, 750]);
  });
});

describe('turn order', () => {
  it('cycles in the set order', () => {
    let game = createGame(STANDARD, ['A', 'B', 'C']);
    expect(game.activeIndex).toBe(0);
    game = resolveTurn(STANDARD, game, { points: 500 });
    expect(game.activeIndex).toBe(1);
    game = resolveTurn(STANDARD, game, { points: 500 });
    game = resolveTurn(STANDARD, game, { points: 500 });
    expect(game.activeIndex).toBe(0);
  });
});

describe('undo', () => {
  it('reverses the banking and hands the turn back', () => {
    let game = createGame(STANDARD, ['Jane', 'Marcus']);
    game = play(game, [500, 600, 550]);
    expect(game.players[0].bankedTotal).toBe(1050);
    expect(game.activeIndex).toBe(1);

    game = undoLastTurn(game);
    expect(game.players[0].bankedTotal).toBe(500);
    expect(game.players[0].turns).toHaveLength(1);
    expect(game.activeIndex).toBe(0);
    expect(game.nextTurnNumber).toBe(3);
  });

  it('takes a player back off the board when their qualifying turn is undone', () => {
    let game = createGame(STANDARD, ['Jane']);
    game = resolveTurn(STANDARD, game, { points: 500 });
    expect(game.players[0].onTheBoard).toBe(true);
    game = undoLastTurn(game);
    expect(game.players[0].onTheBoard).toBe(false);
    expect(canUndo(game)).toBe(false);
  });

  it('is a no-op on a fresh game', () => {
    const game = createGame(STANDARD, ['Jane']);
    expect(undoLastTurn(game)).toEqual(game);
  });
});

describe('endgame (§4.4)', () => {
  it('gives every other player exactly one more turn', () => {
    let game = createGame(STANDARD, ['Jane', 'Marcus', 'Dana']);
    game = play(game, [9800, 5000, 4000]);
    expect(getEndgame(STANDARD, game).active).toBe(false);

    game = resolveTurn(STANDARD, game, { points: 300 }); // Jane crosses 10,000
    let endgame = getEndgame(STANDARD, game);
    expect(endgame.active).toBe(true);
    expect(endgame.over).toBe(false);
    expect(endgame.remaining.map((p) => p.name)).toEqual(['Marcus', 'Dana']);

    game = resolveTurn(STANDARD, game, { points: 1000 }); // Marcus
    expect(getEndgame(STANDARD, game).remaining.map((p) => p.name)).toEqual(['Dana']);

    game = resolveTurn(STANDARD, game, { points: 1000 }); // Dana
    endgame = getEndgame(STANDARD, game);
    expect(endgame.over).toBe(true);
    expect(endgame.winners.map((p) => p.name)).toEqual(['Jane']);
  });

  it('lets a chaser win in the final round', () => {
    let game = createGame(STANDARD, ['Jane', 'Marcus']);
    game = play(game, [9900, 9000]);
    game = resolveTurn(STANDARD, game, { points: 200 }); // Jane → 10,100
    game = resolveTurn(STANDARD, game, { points: 2000 }); // Marcus → 11,000
    const endgame = getEndgame(STANDARD, game);
    expect(endgame.over).toBe(true);
    expect(endgame.winners.map((p) => p.name)).toEqual(['Marcus']);
  });

  it('calls a tie at the top a shared win', () => {
    let game = createGame(STANDARD, ['Jane', 'Marcus']);
    game = play(game, [10_450, 10_450]);
    const endgame = getEndgame(STANDARD, game);
    expect(endgame.over).toBe(true);
    expect(endgame.winners.map((p) => p.name)).toEqual(['Jane', 'Marcus']);
  });

  it('refuses further turns once the game is over', () => {
    let game = createGame(STANDARD, ['Jane']);
    game = resolveTurn(STANDARD, game, { points: 10_000 });
    const frozen = resolveTurn(STANDARD, game, { points: 500 });
    expect(frozen).toBe(game);
  });

  it('unwinds the final round when the crossing turn is undone', () => {
    let game = createGame(STANDARD, ['Jane', 'Marcus']);
    game = play(game, [9800, 5000]);
    game = resolveTurn(STANDARD, game, { points: 300 });
    expect(getEndgame(STANDARD, game).active).toBe(true);
    game = undoLastTurn(game);
    expect(getEndgame(STANDARD, game).active).toBe(false);
  });
});

describe('standings', () => {
  it('ranks players and reports the gap to the leader', () => {
    let game = createGame(JANES, ['Jane', 'Marcus', 'Dana']);
    game = play(game, [3000, 1500, 1500], JANES);
    const standings = getStandings(game);
    expect(standings.map((s) => [s.player.name, s.rank, s.gapToLeader])).toEqual([
      ['Jane', 1, 0],
      ['Marcus', 2, 1500],
      ['Dana', 2, 1500],
    ]);
    expect(standings[0].isLeader).toBe(true);
  });
});

describe('players', () => {
  it('renames mid-game without disturbing scores', () => {
    let game = createGame(STANDARD, ['Jane', 'Marcus']);
    game = play(game, [500]);
    const renamed = renamePlayer(game, game.players[0].id, 'Jane B.');
    expect(renamed.players[0].name).toBe('Jane B.');
    expect(renamed.players[0].bankedTotal).toBe(500);
  });

  it('falls back to a name rather than an empty label', () => {
    const game = createGame(STANDARD, ['   ']);
    expect(game.players[0].name).toBe('Player');
  });
});

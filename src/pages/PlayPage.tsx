import { useEffect, useMemo, useRef, useState } from 'react';
import { useRuleSet } from '../context/RuleSetContext';
import {
  activePlayer,
  canUndo,
  createGame,
  formatScore,
  getEndgame,
  resolveTurn,
  undoLastTurn,
  type GameState,
} from '../lib/game';
import {
  bank,
  bankableTotal,
  canCommit,
  rollOn,
  startTurn,
  toggleDie,
  type TurnState,
} from '../lib/playTurn';
import { usePersistentState } from '../lib/usePersistentState';
import { keys } from '../lib/storage';
import { PlayerSetup } from '../components/PlayerSetup';
import { Standings } from '../components/Standings';
import { Button, Card } from '../components/ui';
import { Modal } from '../components/Modal';
import { EndgameBanner, WinnerBanner } from '../components/Endgame';
import {
  ActiveDice,
  FarkleCallout,
  HotDiceCallout,
  RunningTotal,
  SelectionReadout,
  SetAsideTray,
} from '../components/TurnBoard';
import { Walkthrough } from '../components/Walkthrough';

type PlayState = {
  game: GameState;
  turn: TurnState | null;
  hints: boolean;
  /** Set once the player dismisses the hint toggle, so it stops defaulting on. */
  hintsDismissed: boolean;
};

const ROLL_MS = 480;

export function PlayPage() {
  const rules = useRuleSet();
  const [state, setState, reset] = usePersistentState<PlayState | null>(
    keys.game(rules.storagePrefix),
    null,
  );
  const [rolling, setRolling] = useState(false);
  const [walkthrough, setWalkthrough] = useState(false);
  // A game found in storage at load time is offered, not force-resumed (§6.2).
  const [needsResume, setNeedsResume] = useState(() => state !== null);
  const [confirmNew, setConfirmNew] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const endgame = useMemo(() => (state ? getEndgame(rules, state.game) : null), [rules, state]);

  const flashRoll = () => {
    setRolling(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setRolling(false), ROLL_MS);
  };

  if (walkthrough) {
    return <Walkthrough rules={rules} onExit={() => setWalkthrough(false)} />;
  }

  if (state && needsResume) {
    const names = state.game.players.map((p) => `${p.name} ${formatScore(p.bankedTotal)}`).join(' · ');
    return (
      <Card className="space-y-3">
        <h1 className="font-display text-2xl font-semibold">Resume game?</h1>
        <p className="text-[15px] text-muted">
          There's a {rules.name} game in progress on this device: {names}.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button size="lg" onClick={() => setNeedsResume(false)}>
            Resume
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => {
              reset();
              setNeedsResume(false);
            }}
          >
            Start a new game
          </Button>
        </div>
      </Card>
    );
  }

  if (!state) {
    return (
      <PlayerSetup
        title={`Play — ${rules.name}`}
        intro={`${rules.diceCount} dice, pass the phone around the table. ${rules.tagline}`}
        min={1}
        max={6}
        cta="Start the game"
        showRollForFirst
        onStart={(names) =>
          setState({ game: createGame(rules, names), turn: null, hints: true, hintsDismissed: false })
        }
        extra={
          <Card className="space-y-2">
            <h2 className="font-display text-xl font-semibold">First time?</h2>
            <p className="text-[15px] text-muted">
              Play one guided round first. It walks through setting dice aside, the bank-or-roll
              decision, hot dice and a farkle — and you can leave it at any point.
            </p>
            <Button variant="secondary" onClick={() => setWalkthrough(true)}>
              Play a guided round
            </Button>
          </Card>
        }
      />
    );
  }

  const { game, turn } = state;
  const player = activePlayer(game)!;
  const over = endgame?.over ?? false;

  const setGame = (next: GameState, nextTurn: TurnState | null = null) =>
    setState({ ...state, game: next, turn: nextTurn });

  const beginTurn = () => {
    flashRoll();
    const next = startTurn(rules);
    setState({ ...state, turn: next });
    setAnnouncement(
      next.status === 'farkled'
        ? `${player.name} rolled ${next.active.join(', ')} — farkle.`
        : `${player.name} rolled ${next.active.join(', ')}.`,
    );
  };

  const onToggle = (index: number) => {
    if (!turn) return;
    setState({ ...state, turn: toggleDie(turn, index) });
  };

  const onRollOn = () => {
    if (!turn) return;
    const next = rollOn(rules, turn);
    if (!next) return;
    flashRoll();
    setState({ ...state, turn: next });
    setAnnouncement(
      next.status === 'farkled'
        ? `Farkle — ${formatScore(turn.runningTotal)} lost.`
        : `${next.hotDice ? 'Hot dice! ' : ''}Rolled ${next.active.join(', ')}. Running total ${formatScore(next.runningTotal)}.`,
    );
  };

  const onBank = () => {
    if (!turn) return;
    const banked = bank(rules, turn);
    if (!banked) return;
    const next = resolveTurn(rules, game, { points: banked.points });
    const record = next.players.find((p) => p.id === player.id)?.turns.at(-1);
    setGame(next);
    setAnnouncement(
      record?.outcome === 'below-threshold'
        ? `${player.name} scored ${formatScore(banked.points)} but needs ${formatScore(rules.entryThreshold)} to get on the board. Nothing banked.`
        : `${player.name} banks ${formatScore(banked.points)}, now on ${formatScore(record?.totalAfter ?? 0)}.`,
    );
  };

  const onEndFarkledTurn = () => {
    setGame(resolveTurn(rules, game, { points: 0, farkle: true }));
    setAnnouncement(`${player.name} farkled. Turn over.`);
  };

  const onUndo = () => {
    setGame(undoLastTurn(game));
    setAnnouncement('Last turn undone.');
  };

  const selectionValid = turn ? canCommit(rules, turn) : false;
  const potential = turn ? bankableTotal(rules, turn) : 0;
  const needsBoard = !player.onTheBoard;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl font-semibold">Play</h1>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setWalkthrough(true)}>
          Guided round
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirmNew(true)}>
          New game
        </Button>
      </div>

      {over ? <WinnerBanner rules={rules} endgame={endgame!} /> : null}
      {endgame?.active && !over ? (
        <EndgameBanner rules={rules} endgame={endgame} game={game} />
      ) : null}

      <Standings rules={rules} state={game} compact />

      {!over ? (
        <>
          {turn === null ? (
            <Card className="space-y-3 text-center">
              <p className="font-display text-2xl font-semibold">{player.name}'s turn</p>
              {needsBoard ? (
                <p className="text-[15px] text-muted">
                  Needs {formatScore(rules.entryThreshold)} in a single turn to get on the board.
                </p>
              ) : (
                <p className="text-[15px] text-muted">
                  On {formatScore(player.bankedTotal)}. {formatScore(Math.max(0, rules.targetScore - player.bankedTotal))} to reach{' '}
                  {formatScore(rules.targetScore)}.
                </p>
              )}
              <Button size="lg" className="w-full" onClick={beginTurn}>
                Roll {rules.diceCount} dice
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              <SetAsideTray turn={turn} />

              {turn.hotDice && turn.status === 'live' ? <HotDiceCallout rules={rules} /> : null}

              <RunningTotal rules={rules} turn={turn} />

              {turn.status === 'farkled' ? (
                <FarkleCallout lost={turn.runningTotal} />
              ) : null}

              <ActiveDice
                rules={rules}
                turn={turn}
                onToggle={onToggle}
                hints={state.hints}
                rolling={rolling}
              />

              <SelectionReadout rules={rules} turn={turn} />

              {needsBoard && turn.status === 'live' ? (
                <p className="text-center text-[14px] text-muted">
                  You need {formatScore(rules.entryThreshold)} to get on the board — you have{' '}
                  {formatScore(potential)}.
                </p>
              ) : null}

              <div className="sticky bottom-[calc(80px+env(safe-area-inset-bottom))] z-10 space-y-2 md:static">
                {turn.status === 'farkled' ? (
                  <Button size="lg" className="w-full" onClick={onEndFarkledTurn}>
                    Pass to {game.players[(game.activeIndex + 1) % game.players.length].name}
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="lg" variant="secondary" onClick={onRollOn} disabled={!selectionValid}>
                      Roll again
                    </Button>
                    <Button size="lg" onClick={onBank} disabled={!selectionValid}>
                      Bank {selectionValid ? formatScore(potential) : ''}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <label className="flex min-h-11 items-center gap-2 rounded-2xl border-2 border-line bg-surface px-3">
          <input
            type="checkbox"
            className="h-5 w-5 accent-[var(--c-accent)]"
            checked={state.hints}
            onChange={(event) =>
              setState({ ...state, hints: event.target.checked, hintsDismissed: true })
            }
          />
          <span className="text-[15px] font-semibold">Highlight scoring dice</span>
        </label>
        <Button variant="secondary" size="sm" onClick={onUndo} disabled={!canUndo(game)}>
          ↩ Undo last turn
        </Button>
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <Modal open={confirmNew} onClose={() => setConfirmNew(false)} title="Start a new game?">
        <p className="mb-4">
          This ends the current {rules.name} game and clears every score. Your names are kept.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              reset();
              setConfirmNew(false);
            }}
          >
            Yes, new game
          </Button>
          <Button variant="secondary" onClick={() => setConfirmNew(false)}>
            Keep playing
          </Button>
        </div>
      </Modal>
    </div>
  );
}

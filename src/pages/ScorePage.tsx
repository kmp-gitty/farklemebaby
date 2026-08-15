import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRuleSet } from '../context/RuleSetContext';
import {
  activePlayer,
  canUndo,
  createGame,
  describeTurn,
  formatScore,
  getEndgame,
  resolveTurn,
  undoLastTurn,
  type GameState,
} from '../lib/game';
import { usePersistentState } from '../lib/usePersistentState';
import { keys } from '../lib/storage';
import { PlayerSetup } from '../components/PlayerSetup';
import { Standings } from '../components/Standings';
import { ScoringTable } from '../components/ScoringTable';
import { Button, Card } from '../components/ui';
import { Modal } from '../components/Modal';
import { EndgameBanner, WinnerBanner } from '../components/Endgame';

const QUICK_ADDS = [50, 100, 300, 500, 1000];

export function ScorePage() {
  const rules = useRuleSet();
  const [game, setGame, resetGame] = usePersistentState<GameState | null>(
    keys.scorePad(rules.storagePrefix),
    null,
  );
  const [entry, setEntry] = useState('');
  const [message, setMessage] = useState<{ text: string; canOverride: boolean } | null>(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const endgame = useMemo(() => (game ? getEndgame(rules, game) : null), [rules, game]);

  if (!game) {
    return (
      <PlayerSetup
        title="Score Pad"
        intro={`Keeping score for a real table, ${rules.name.toLowerCase()}. No dice on this page — you've got those.`}
        min={1}
        max={8}
        cta="Start keeping score"
        onStart={(names) => {
          setGame(createGame(rules, names));
          setMessage(null);
        }}
        extra={
          <Card>
            <h2 className="mb-2 font-display text-xl font-semibold">{rules.name} in one line</h2>
            <p className="text-[15px] text-muted">{rules.tagline}</p>
            <p className="mt-2 text-[15px] text-muted">
              {formatScore(rules.entryThreshold)} in a single turn to get on the board.{' '}
              {formatScore(rules.targetScore)} to win, then everyone else gets one last turn.
            </p>
          </Card>
        }
      />
    );
  }

  const player = activePlayer(game)!;
  const points = Number.parseInt(entry || '0', 10) || 0;
  const wouldBlock = !player.onTheBoard && points > 0 && points < rules.entryThreshold;

  const submit = (turnPoints: number, farkle: boolean, override = false) => {
    const next = resolveTurn(rules, game, { points: turnPoints, farkle, overrideThreshold: override });
    const record = next.players.find((p) => p.id === player.id)?.turns.at(-1);
    setGame(next);
    setEntry('');
    if (record) {
      setMessage({
        text: describeTurn(rules, player, record),
        canOverride: record.outcome === 'below-threshold',
      });
    }
  };

  const override = () => {
    const reverted = undoLastTurn(game);
    const last = player.turns.at(-1);
    setGame(resolveTurn(rules, reverted, { points: last?.runningTotal ?? 0, overrideThreshold: true }));
    setMessage({ text: `House rule applied — ${player.name} is on the board.`, canOverride: false });
  };

  const undo = () => {
    setGame(undoLastTurn(game));
    setMessage(null);
    setEntry('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-3xl font-semibold">Score Pad</h1>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => setConfirmNew(true)}
        >
          New game
        </Button>
      </div>

      {endgame?.over ? <WinnerBanner rules={rules} endgame={endgame} /> : null}
      {endgame?.active && !endgame.over ? (
        <EndgameBanner rules={rules} endgame={endgame} game={game} />
      ) : null}

      <Standings rules={rules} state={game} />

      {!endgame?.over ? (
        <Card className="space-y-3">
          <h2 className="font-display text-xl font-semibold">
            {player.name}'s turn
            {!player.onTheBoard ? (
              <span className="block text-[14px] font-normal text-muted">
                Needs {formatScore(rules.entryThreshold)} in one turn to get on the board
              </span>
            ) : null}
          </h2>

          <label className="block">
            <span className="text-[14px] font-semibold text-muted">Points this turn</span>
            <input
              value={entry}
              onChange={(event) => setEntry(event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              placeholder="0"
              aria-label={`Points scored by ${player.name} this turn`}
              className="tnum mt-1 w-full rounded-2xl border-2 border-line bg-surface-2 px-4 py-3 text-center font-display text-5xl font-semibold"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {QUICK_ADDS.map((value) => (
              <Button
                key={value}
                variant="secondary"
                size="sm"
                className="tnum flex-1"
                onClick={() => setEntry(String((Number.parseInt(entry || '0', 10) || 0) + value))}
              >
                +{formatScore(value)}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEntry('')}
              disabled={entry === ''}
              aria-label="Clear the entry"
            >
              Clear
            </Button>
          </div>

          {wouldBlock ? (
            <p className="text-[14px] text-muted">
              {formatScore(points)} is under the {formatScore(rules.entryThreshold)} entry threshold —
              you'll get the option to bank it anyway.
            </p>
          ) : null}

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Button size="lg" onClick={() => submit(points, false)} disabled={points <= 0}>
              Bank {points > 0 ? formatScore(points) : ''}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => submit(0, true)}>
              Farkle
            </Button>
          </div>
        </Card>
      ) : null}

      <p aria-live="polite" className="min-h-6">
        {message ? (
          <span className="flex flex-wrap items-center gap-2 text-[16px] font-semibold">
            {message.text}
            {message.canOverride ? (
              <Button variant="danger" size="sm" onClick={override}>
                Bank it anyway (house rule)
              </Button>
            ) : null}
          </span>
        ) : null}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={undo} disabled={!canUndo(game)}>
          ↩ Undo last entry
        </Button>
        <Button variant="ghost" onClick={() => setShowTable(true)}>
          Scoring reference
        </Button>
      </div>

      <p className="text-[14px] text-muted">
        Playing {rules.name} — {rules.tagline}{' '}
        <Link to={rules.basePath === '' ? '/#scoring' : '/janes#scoring'} className="underline underline-offset-2">
          Full rules
        </Link>
      </p>

      <Modal open={showTable} onClose={() => setShowTable(false)} title={`${rules.name} scoring`}>
        <ScoringTable rules={rules} />
      </Modal>

      <Modal open={confirmNew} onClose={() => setConfirmNew(false)} title="Start a new game?">
        <p className="mb-4">
          This clears the current {rules.name} score pad, including every player's turn history. Your
          {' '}names are kept.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              resetGame();
              setConfirmNew(false);
              setMessage(null);
              setEntry('');
            }}
          >
            Yes, clear it
          </Button>
          <Button variant="secondary" onClick={() => setConfirmNew(false)}>
            Keep playing
          </Button>
        </div>
      </Modal>
    </div>
  );
}

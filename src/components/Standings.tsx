import { useState } from 'react';
import type { RuleSet } from '../lib/rules';
import { formatScore, getEndgame, getStandings, type GameState, type Player } from '../lib/game';
import { Modal } from './Modal';
import { Pill } from './ui';

export function Standings({
  rules,
  state,
  compact = false,
}: {
  rules: RuleSet;
  state: GameState;
  /** The strip that sits above the dice on /play. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState<Player | null>(null);
  const standings = getStandings(state);
  const endgame = getEndgame(rules, state);

  return (
    <>
      <ol className="space-y-1.5" aria-label="Standings">
        {standings.map((standing) => {
          const { player } = standing;
          const needsBoard = !player.onTheBoard;
          return (
            <li key={player.id}>
              <button
                type="button"
                onClick={() => setOpen(player)}
                className={`flex w-full items-center gap-2 rounded-2xl border-2 px-3 text-left ${
                  compact ? 'min-h-12 py-1' : 'min-h-14 py-2'
                } ${
                  standing.isActive
                    ? 'border-accent bg-accent-soft'
                    : 'border-line bg-surface'
                }`}
                aria-label={`${player.name}, ${formatScore(player.bankedTotal)} points${
                  standing.isActive ? ', their turn' : ''
                }. Show turn history.`}
              >
                <span className="tnum w-6 shrink-0 text-center text-[15px] font-semibold text-muted">
                  {standing.rank}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate font-semibold">{player.name}</span>
                    {standing.isActive ? (
                      <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-ink uppercase">
                        Their turn
                      </span>
                    ) : null}
                    {standing.isLeader && !endgame.over ? (
                      <span className="shrink-0 text-[13px] font-semibold text-muted">Leader</span>
                    ) : null}
                  </span>
                  {!compact ? (
                    <span className="block text-[13px] text-muted">
                      {needsBoard
                        ? `Needs ${formatScore(rules.entryThreshold)} in one turn to get on the board`
                        : standing.gapToLeader > 0
                          ? `${formatScore(standing.gapToLeader)} behind`
                          : `${formatScore(Math.max(0, rules.targetScore - player.bankedTotal))} to ${formatScore(rules.targetScore)}`}
                    </span>
                  ) : null}
                </span>
                <span className="tnum shrink-0 font-display text-2xl font-semibold">
                  {formatScore(player.bankedTotal)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <Modal
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open ? `${open.name} — turn by turn` : ''}
      >
        {open ? <TurnHistory rules={rules} player={findPlayer(state, open.id) ?? open} /> : null}
      </Modal>
    </>
  );
}

function findPlayer(state: GameState, id: string): Player | undefined {
  return state.players.find((player) => player.id === id);
}

export function TurnHistory({ rules, player }: { rules: RuleSet; player: Player }) {
  if (player.turns.length === 0) {
    return <p className="text-muted">No turns yet.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-[15px] text-muted">
        {player.onTheBoard
          ? `On the board. ${formatScore(player.bankedTotal)} banked.`
          : `Not on the board yet — needs ${formatScore(rules.entryThreshold)} in a single turn.`}
      </p>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b-2 border-line text-[13px] text-muted uppercase">
            <th scope="col" className="py-1.5 pr-2 font-semibold">Turn</th>
            <th scope="col" className="py-1.5 pr-2 font-semibold">Rolled</th>
            <th scope="col" className="py-1.5 pr-2 font-semibold">Banked</th>
            <th scope="col" className="py-1.5 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody className="tnum">
          {player.turns.map((turn, index) => (
            <tr key={turn.turnNumber} className="border-b border-line">
              <td className="py-2 pr-2">{index + 1}</td>
              <td className="py-2 pr-2">
                {turn.outcome === 'farkle' ? (
                  <Pill tone="warn">Farkle</Pill>
                ) : turn.outcome === 'below-threshold' ? (
                  <span>
                    {formatScore(turn.runningTotal)} <Pill tone="warn">under {formatScore(rules.entryThreshold)}</Pill>
                  </span>
                ) : (
                  formatScore(turn.runningTotal)
                )}
              </td>
              <td className="py-2 pr-2">{formatScore(turn.banked)}</td>
              <td className="py-2 text-right font-semibold">{formatScore(turn.totalAfter)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

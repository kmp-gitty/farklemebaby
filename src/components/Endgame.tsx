import type { RuleSet } from '../lib/rules';
import { formatScore, type Endgame, type GameState } from '../lib/game';
import { Callout } from './ui';

export function EndgameBanner({
  rules,
  endgame,
  game,
}: {
  rules: RuleSet;
  endgame: Endgame;
  game: GameState;
}) {
  const leader = Math.max(...game.players.map((player) => player.bankedTotal));

  return (
    <Callout tone="warn" title={`Final round — ${endgame.triggeredBy?.name} passed ${formatScore(rules.targetScore)}`}>
      <p>Everyone else gets exactly one more turn. Highest total wins.</p>
      <ul className="mt-2 space-y-1">
        {endgame.remaining.map((player) => (
          <li key={player.id}>
            <strong>{player.name}</strong> needs{' '}
            <span className="tnum">{formatScore(Math.max(1, leader - player.bankedTotal + 1))}</span> to
            take the lead.
          </li>
        ))}
      </ul>
    </Callout>
  );
}

export function WinnerBanner({ rules: _rules, endgame }: { rules: RuleSet; endgame: Endgame }) {
  const names = endgame.winners.map((player) => player.name);
  const total = endgame.winners[0]?.bankedTotal ?? 0;

  const headline =
    names.length > 1
      ? `Tie game — ${listNames(names)} both finish on ${formatScore(total)}`
      : `${names[0]} wins with ${formatScore(total)}`;

  return (
    <div role="status" className="pop-in rounded-3xl border-2 border-accent bg-accent-soft p-4 text-center">
      <p className="font-display text-2xl font-semibold">{headline}</p>
      <p className="mt-1 text-[15px] text-muted">
        {names.length > 1 ? 'A shared win — nobody has to lose.' : 'Game over. Tap New game to go again.'}
      </p>
    </div>
  );
}

function listNames(names: string[]): string {
  if (names.length <= 2) return names.join(' and ');
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

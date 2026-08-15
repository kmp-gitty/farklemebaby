import { useState } from 'react';
import { rollDie } from '../lib/dice';
import { load, keys, save } from '../lib/storage';
import { Button, Card, Callout } from '../components/ui';
import { Die } from './Die';
import type { DieFace } from '../lib/rules';

const DEFAULTS = ['Jane', 'Marcus', 'Dana', 'Rae', 'Sam', 'Ollie', 'Kit', 'Nico'];

export function loadNames(fallbackCount: number): string[] {
  const stored = load<string[]>(keys.playerNames);
  if (stored && stored.length >= 1) return stored;
  return DEFAULTS.slice(0, fallbackCount);
}

export function PlayerSetup({
  title,
  intro,
  min,
  max,
  cta,
  showRollForFirst = false,
  onStart,
  extra,
}: {
  title: string;
  intro?: string;
  min: number;
  max: number;
  cta: string;
  showRollForFirst?: boolean;
  onStart: (names: string[]) => void;
  extra?: React.ReactNode;
}) {
  const [names, setNames] = useState<string[]>(() => loadNames(Math.max(min, 2)));
  const [rolls, setRolls] = useState<DieFace[] | null>(null);

  const update = (index: number, value: string) =>
    setNames((current) => current.map((name, i) => (i === index ? value : name)));

  const add = () =>
    setNames((current) => [
      ...current,
      DEFAULTS.find((name) => !current.includes(name)) ?? `Player ${current.length + 1}`,
    ]);

  const remove = (index: number) => setNames((current) => current.filter((_, i) => i !== index));

  const move = (index: number, direction: -1 | 1) =>
    setNames((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });

  const rollForFirst = () => {
    // Highest single die goes first; ties are broken by another roll (§4.5).
    const scored = names.map((name, index) => ({ name, index, roll: rollDie(), tiebreak: Math.random() }));
    scored.sort((a, b) => b.roll - a.roll || b.tiebreak - a.tiebreak);
    setNames(scored.map((entry) => entry.name));
    setRolls(scored.map((entry) => entry.roll));
  };

  const clean = names.map((name, index) => name.trim() || `Player ${index + 1}`);
  const ready = clean.length >= min && clean.length <= max;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl font-semibold">{title}</h1>
        {intro ? <p className="text-muted">{intro}</p> : null}
      </header>

      <Card className="space-y-3">
        <h2 className="font-display text-xl font-semibold">
          Players <span className="text-muted">({clean.length})</span>
        </h2>

        <ol className="space-y-2">
          {names.map((name, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="tnum w-6 text-center text-[15px] font-semibold text-muted">
                {index + 1}
              </span>
              {rolls?.[index] ? <Die face={rolls[index]} size={28} /> : null}
              <input
                value={name}
                onChange={(event) => update(index, event.target.value)}
                aria-label={`Player ${index + 1} name`}
                maxLength={18}
                className="min-h-12 min-w-0 flex-1 rounded-2xl border-2 border-line bg-surface-2 px-3 text-[17px] font-semibold"
              />
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="grid h-6 w-9 place-items-center rounded-t-lg border-2 border-line text-xs disabled:opacity-30"
                  aria-label={`Move ${name || `player ${index + 1}`} up`}
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === names.length - 1}
                  className="grid h-6 w-9 place-items-center rounded-b-lg border-2 border-t-0 border-line text-xs disabled:opacity-30"
                  aria-label={`Move ${name || `player ${index + 1}`} down`}
                >
                  ▼
                </button>
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={names.length <= min}
                className="grid h-12 w-11 place-items-center rounded-2xl border-2 border-line text-lg disabled:opacity-30"
                aria-label={`Remove ${name || `player ${index + 1}`}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={add} disabled={names.length >= max}>
            Add player
          </Button>
          {showRollForFirst ? (
            <Button variant="secondary" size="sm" onClick={rollForFirst}>
              Roll for first
            </Button>
          ) : null}
        </div>

        {rolls ? (
          <Callout tone="good" title="Order set">
            Highest single die goes first, play passes left. Reorder by hand if you'd rather.
          </Callout>
        ) : null}
      </Card>

      {extra}

      <Button
        size="lg"
        className="w-full"
        disabled={!ready}
        onClick={() => {
          save(keys.playerNames, clean);
          onStart(clean);
        }}
      >
        {cta}
      </Button>
      <p className="text-center text-[14px] text-muted">
        {min}–{max} players. Names are remembered for next time.
      </p>
    </div>
  );
}

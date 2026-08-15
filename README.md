# Farkle Me Baby

Four small tools for the dice game Farkle, in two rule sets.

- **Rules** — the reference you pull up mid-argument at the table
- **Play** — a full digital game, solo or pass-and-play, with an optional guided round
- **Score Pad** — scorekeeping for people playing with real dice (no dice on the page)
- **Dice** — a dice roller for people who have a score pad but lost the dice

Two independent rule sets, each with the same four tools:

| Standard (6 dice) | Jane's (11 dice) |
| --- | --- |
| `/` | `/janes` |
| `/play` | `/janes/play` |
| `/score` | `/janes/score` |
| `/dice` | `/janes/dice` |

Plus `/history` — a short, honest history of a folk game nobody invented.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # scoring engine, score model, turn engine, route smoke tests
npm run build    # static build into dist/
```

## How it's put together

No backend. No accounts, no database, no API keys, no analytics. Everything runs in the
browser and persists to `localStorage`.

```
src/lib/rules.ts       RuleSet config — every scoring value lives here, nothing is hardcoded
src/lib/scoring.ts     the scoring engine: memoised search over the dice count vector
src/lib/game.ts        the score model shared by /play and /score — banking, standings, undo, endgame
src/lib/playTurn.ts    one turn of the digital game — set aside, roll on, hot dice, farkle
src/lib/storage.ts     the only file that touches localStorage
```

Rule sets are **config, not code**. `/play` and `/janes/play` are the same components rendered
with a different `RuleSet`; the only per-branch differences are the rules object, the storage
namespace and the accent colour. If you find yourself writing a Jane's-specific component, the
difference belongs in `src/lib/rules.ts` instead.

Storage is namespaced per rule set (`farkle:standard:game`, `farkle:janes:game`), so a Standard
game and a Jane's game can both be in progress without touching each other.

## Tests

The scoring engine is pure and fully tested, including every case from the build spec and an
exhaustive proof that a Farkle is mathematically impossible on 9, 10 or 11 dice under Jane's
rules. Run `npm test`.

## Deploying

Static build, deployed to Vercel. `vercel.json` rewrites all non-asset paths to `index.html`
so the client routes work on refresh.

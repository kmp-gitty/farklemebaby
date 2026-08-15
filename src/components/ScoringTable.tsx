import { FACES, type DieFace, type RuleSet } from '../lib/rules';
import { formatScore } from '../lib/game';
import { Die } from './Die';

function Dice({ faces }: { faces: DieFace[] }) {
  return (
    <span className="flex flex-wrap items-center gap-1">
      {faces.map((face, index) => (
        <Die key={index} face={face} size={24} />
      ))}
    </span>
  );
}

type Row = { label: React.ReactNode; points: string; note?: string };

export function ScoringTable({ rules, compact = false }: { rules: RuleSet; compact?: boolean }) {
  const rows: Row[] = [];

  for (const face of FACES) {
    const value = rules.singles[face];
    if (value === undefined) continue;
    rows.push({ label: <Dice faces={[face]} />, points: formatScore(value), note: `Single ${face}` });
  }

  for (const face of FACES) {
    rows.push({
      label: <Dice faces={[face, face, face]} />,
      points: formatScore(rules.triplets[face]),
      note: `Three ${face}s`,
    });
  }

  if (rules.multiples) {
    rows.push({
      label: <span className="font-semibold">Four of any number</span>,
      points: formatScore(rules.multiples.four),
      note: 'Any face — four 2s and four 6s are the same',
    });
    rows.push({
      label: <span className="font-semibold">Five of any number</span>,
      points: formatScore(rules.multiples.five),
    });
    rows.push({
      label: <span className="font-semibold">Six of any number</span>,
      points: formatScore(rules.multiples.six),
    });
  }

  if (rules.specials) {
    rows.push({
      label: <Dice faces={[1, 2, 3, 4, 5, 6]} />,
      points: formatScore(rules.specials.straight),
      note: '1–6 straight — uses all six dice',
    });
    rows.push({
      label: <Dice faces={[2, 2, 4, 4, 6, 6]} />,
      points: formatScore(rules.specials.threePairs),
      note: 'Three pairs — any pairs, uses all six dice',
    });
    rows.push({
      label: <Dice faces={[3, 3, 3, 3, 5, 5]} />,
      points: formatScore(rules.specials.fourPlusPair),
      note: 'Four of a kind + a pair',
    });
    rows.push({
      label: <Dice faces={[2, 2, 2, 6, 6, 6]} />,
      points: formatScore(rules.specials.twoTriplets),
      note: 'Two triplets',
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">{rules.name} scoring table</caption>
        <thead>
          <tr className="border-b-2 border-line">
            <th scope="col" className="py-2 pr-3 text-[13px] font-semibold text-muted uppercase">
              Combination
            </th>
            <th scope="col" className="py-2 text-right text-[13px] font-semibold text-muted uppercase">
              Points
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-line align-middle">
              <td className="py-2.5 pr-3">
                {row.label}
                {row.note && !compact ? (
                  <span className="mt-0.5 block text-[13px] text-muted">{row.note}</span>
                ) : null}
              </td>
              <td className="tnum py-2.5 text-right font-display text-xl font-semibold whitespace-nowrap">
                {row.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-3 text-[14px] text-muted">
        Combinations are scored <strong>within a single roll only</strong>. Dice from separate rolls
        can never be combined.
        {!rules.multiples && !rules.specials
          ? ' A fourth matching die is simply a dead die.'
          : ' Only 1s and 5s score as singles — a lone 2, 3, 4 or 6 is worth nothing.'}
      </p>
    </div>
  );
}

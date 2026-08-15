import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { STANDARD } from '../lib/rules';
import { bestPossible, scoreSelection } from '../lib/scoring';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('routes render', () => {
  const routes: Array<[string, string | RegExp]> = [
    ['/', 'Farkle'],
    ['/play', /Play —/],
    ['/score', 'Score Pad'],
    ['/dice', 'Dice'],
    ['/janes', "Jane's Rules"],
    ['/janes/play', /Play —/],
    ['/janes/score', 'Score Pad'],
    ['/janes/dice', 'Dice'],
    ['/history', 'Nobody invented Farkle'],
    ['/nonsense', 'Farkle.'],
  ];

  it.each(routes)('%s renders', (path, heading) => {
    renderAt(path);
    expect(screen.getAllByRole('heading', { name: heading }).length).toBeGreaterThan(0);
  });
});

describe('the rule set is obvious from every page', () => {
  it('names Standard and its dice count', () => {
    renderAt('/score');
    expect(screen.getByText(/Standard Rules · 6 dice/)).toBeInTheDocument();
  });

  it("names Jane's and her dice count", () => {
    renderAt('/janes/score');
    expect(screen.getByText(/Jane's Rules · 11 dice/)).toBeInTheDocument();
  });

  it('switches to the equivalent page, not the home page', () => {
    renderAt('/score');
    const switcher = screen.getAllByRole('group', { name: 'Rule set' })[0];
    expect(within(switcher).getByRole('link', { name: "Jane's Rules" })).toHaveAttribute(
      'href',
      '/janes/score',
    );
    expect(within(switcher).getByRole('link', { name: 'Standard Rules' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });
});

describe('/dice', () => {
  it('rolls the rule set default and shows no scoring until asked', async () => {
    const user = userEvent.setup();
    renderAt('/janes/dice');

    await user.click(screen.getByRole('button', { name: 'Roll' }));
    expect(screen.getAllByRole('button', { name: /^Die showing/ })).toHaveLength(11);
    expect(screen.queryByText(/Best available/)).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('Scoring help'));
    expect(screen.getByText(/Best available/)).toBeInTheDocument();
  });

  it('scores the dice you are holding, combination by combination', async () => {
    const user = userEvent.setup();
    renderAt('/dice');
    await user.click(screen.getByLabelText('Scoring help'));
    await user.click(screen.getByRole('button', { name: 'Roll' }));

    // Hold everything that scores, then read the total back.
    await user.click(screen.getByRole('button', { name: 'Hold everything that scores' }));

    const dice = screen.getAllByRole('button', { name: /^Die showing/ });
    const held = dice.filter((die) => die.getAttribute('aria-pressed') === 'true');
    const heldFaces = held.map((die) => Number(die.getAttribute('aria-label')!.match(/\d/)![0]));

    const expected = bestPossible(STANDARD, heldFaces).points;
    expect(expected).toBeGreaterThan(0);
    expect(
      screen.getByLabelText(`Held dice score: ${expected.toLocaleString('en-US')}`),
    ).toBeInTheDocument();
    // Every held die belongs to a combination, so nothing is called out as dead.
    expect(screen.queryByText('Scoring nothing:')).not.toBeInTheDocument();
  });

  it('names the held dice that carry nothing', async () => {
    const user = userEvent.setup();
    renderAt('/dice');
    await user.click(screen.getByLabelText('Scoring help'));
    await user.click(screen.getByRole('button', { name: 'Roll' }));

    // Hold every die — on six dice at least one is usually dead, but when the
    // roll happens to score in full there is correctly nothing to report.
    const dice = screen.getAllByRole('button', { name: /^Die showing/ });
    for (const die of dice) await user.click(die);

    const faces = dice.map((die) => Number(die.getAttribute('aria-label')!.match(/\d/)![0]));
    const fullyScores = scoreSelection(STANDARD, faces) !== null;
    expect(screen.queryByText('Scoring nothing:') !== null).toBe(!fullyScores);
  });

  it('leaves scoring help off by default', () => {
    renderAt('/dice');
    expect(screen.getByLabelText('Scoring help')).not.toBeChecked();
  });

  /** Seed the page's persisted state so the dice aren't random. */
  function seedDice(state: Record<string, unknown>) {
    window.localStorage.setItem(
      'farkle:standard:dice',
      JSON.stringify({ v: 1, data: { count: 6, history: [], hints: true, ...state } }),
    );
  }

  it('calls a farkle when the whole roll is dead', () => {
    seedDice({ dice: [2, 3, 4, 6, 2, 3], held: [], lastRolled: [0, 1, 2, 3, 4, 5] });
    renderAt('/dice');
    expect(screen.getByRole('heading', { name: 'Farkle.' })).toBeInTheDocument();
  });

  it('calls a farkle on the thrown dice even while scoring dice are held', () => {
    // Three 1s held from an earlier roll, then 2-3-4 thrown. The held dice are
    // still worth 300 — but the throw scores nothing, so it is a farkle.
    seedDice({ dice: [1, 1, 1, 2, 3, 4], held: [0, 1, 2], lastRolled: [3, 4, 5] });
    renderAt('/dice');
    expect(screen.getByRole('heading', { name: 'Farkle.' })).toBeInTheDocument();
    expect(screen.getByText(/everything set aside this turn would be lost/)).toBeInTheDocument();
    // The held dice still report their own value.
    expect(screen.getByLabelText('Held dice score: 300')).toBeInTheDocument();
  });

  it('does not call a farkle when the thrown dice score', () => {
    seedDice({ dice: [1, 1, 1, 5, 3, 4], held: [0, 1, 2], lastRolled: [3, 4, 5] });
    renderAt('/dice');
    expect(screen.queryByRole('heading', { name: 'Farkle.' })).not.toBeInTheDocument();
  });

  it('judges the farkle on what was thrown, not on holds changed afterwards', async () => {
    const user = userEvent.setup();
    // The 2, 3 and 4 were thrown and score nothing. Holding one of them after
    // the fact must not make the farkle disappear.
    seedDice({ dice: [1, 1, 1, 2, 3, 4], held: [0, 1, 2], lastRolled: [3, 4, 5] });
    renderAt('/dice');
    await user.click(screen.getByRole('button', { name: /^Die showing 2/ }));
    expect(screen.getByRole('heading', { name: 'Farkle.' })).toBeInTheDocument();
  });

  it('keeps 11 dice within a 375px tray', async () => {
    const user = userEvent.setup();
    renderAt('/janes/dice');
    await user.click(screen.getByRole('button', { name: 'Roll' }));
    const tray = screen.getByRole('group', { name: 'Dice' });
    // 4 columns × 82px + 3 × 10px gap = 358px, inside a 375px screen's padding.
    expect(tray.style.maxWidth).toBe('358px');
  });
});

describe('/score', () => {
  it('runs a turn end to end and updates the standings immediately', async () => {
    const user = userEvent.setup();
    renderAt('/score');

    await user.click(screen.getByRole('button', { name: 'Start keeping score' }));
    await user.click(screen.getByRole('button', { name: '+500' }));
    await user.click(screen.getByRole('button', { name: /^Bank 500/ }));

    expect(screen.getByText(/banks 500 → 500/)).toBeInTheDocument();
    const standings = screen.getByRole('list', { name: 'Standings' });
    expect(within(standings).getByText('500')).toBeInTheDocument();
  });

  it('blocks a sub-threshold first turn but offers the house-rule override', async () => {
    const user = userEvent.setup();
    renderAt('/score');

    await user.click(screen.getByRole('button', { name: 'Start keeping score' }));
    await user.click(screen.getByRole('button', { name: '+300' }));
    await user.click(screen.getByRole('button', { name: /^Bank 300/ }));

    expect(screen.getByText(/needs 500 in one turn/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Bank it anyway/ }));
    expect(screen.getByText(/House rule applied/)).toBeInTheDocument();
  });

  it('undoes the last entry', async () => {
    const user = userEvent.setup();
    renderAt('/score');

    await user.click(screen.getByRole('button', { name: 'Start keeping score' }));
    await user.click(screen.getByRole('button', { name: '+1,000' }));
    await user.click(screen.getByRole('button', { name: /^Bank 1,000/ }));
    await user.click(screen.getByRole('button', { name: /Undo last entry/ }));

    const standings = screen.getByRole('list', { name: 'Standings' });
    expect(within(standings).queryByText('1,000')).not.toBeInTheDocument();
  });
});

describe('/play', () => {
  it('starts a game, rolls, and offers a resume on the next load', async () => {
    const user = userEvent.setup();
    const first = renderAt('/play');

    await user.click(screen.getByRole('button', { name: 'Start the game' }));
    await user.click(screen.getByRole('button', { name: /Roll 6 dice/ }));
    expect(screen.getAllByRole('button', { name: /^Die showing/ })).toHaveLength(6);

    first.unmount();
    renderAt('/play');
    expect(screen.getByRole('heading', { name: 'Resume game?' })).toBeInTheDocument();
  });

  it('keeps a Standard game and a Jane’s game apart', async () => {
    const user = userEvent.setup();
    const standard = renderAt('/play');
    await user.click(screen.getByRole('button', { name: 'Start the game' }));
    standard.unmount();

    const janes = renderAt('/janes/play');
    // No Jane's game exists yet, so it goes to setup rather than resuming.
    expect(screen.getByRole('button', { name: 'Start the game' })).toBeInTheDocument();
    janes.unmount();

    renderAt('/play');
    expect(screen.getByRole('heading', { name: 'Resume game?' })).toBeInTheDocument();
  });
});

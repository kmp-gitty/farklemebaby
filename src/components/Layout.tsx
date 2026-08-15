import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useRuleSet } from '../context/RuleSetContext';
import { JANES, STANDARD, type RuleSet } from '../lib/rules';
import { load, save } from '../lib/storage';

/** '/janes/score' → '/score', '/janes' → '/'. */
function suffixOf(pathname: string): string {
  if (pathname === '/janes' || pathname === '/janes/') return '/';
  if (pathname.startsWith('/janes/')) return pathname.slice('/janes'.length);
  return pathname;
}

function pathIn(rules: RuleSet, suffix: string): string {
  if (suffix === '/') return rules.basePath === '' ? '/' : '/janes';
  return `${rules.basePath}${suffix}`;
}

const TABS = [
  { suffix: '/', label: 'Rules', icon: '📖' },
  { suffix: '/play', label: 'Play', icon: '🎲' },
  { suffix: '/score', label: 'Score Pad', icon: '📝' },
  { suffix: '/dice', label: 'Dice', icon: '🎯' },
] as const;

function ThemeToggle() {
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>(
    () => load<'system' | 'light' | 'dark'>('farkle:theme') ?? 'system',
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    save('farkle:theme', theme);
  }, [theme]);

  const next = theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system';
  const labels = { system: 'System theme', dark: 'Dark theme', light: 'Light theme' } as const;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="grid h-11 w-11 place-items-center rounded-full border-2 border-line bg-surface text-lg"
      aria-label={`${labels[theme]}. Switch to ${labels[next].toLowerCase()}`}
      title={labels[theme]}
    >
      {theme === 'system' ? '◐' : theme === 'dark' ? '☾' : '☀'}
    </button>
  );
}

function RuleSetSwitcher({ full = false }: { full?: boolean }) {
  const rules = useRuleSet();
  const { pathname } = useLocation();
  const suffix = suffixOf(pathname);

  return (
    <div
      className={`rounded-full border-2 border-line bg-surface-2 p-1 ${
        full ? 'grid grid-cols-2' : 'inline-flex'
      }`}
      role="group"
      aria-label="Rule set"
    >
      {[STANDARD, JANES].map((option) => {
        const current = option.id === rules.id;
        return (
          <Link
            key={option.id}
            to={pathIn(option, suffix)}
            aria-current={current ? 'true' : undefined}
            className={`flex items-center justify-center rounded-full px-3 py-1 text-center font-semibold no-underline transition-colors ${
              full ? 'min-h-10 text-[16px]' : 'min-h-9 text-[15px]'
            } ${current ? 'bg-accent text-accent-ink' : 'text-muted'}`}
          >
            {option.name}
          </Link>
        );
      })}
    </div>
  );
}

export function Layout() {
  const rules = useRuleSet();
  const { pathname } = useLocation();
  const isArticle = pathname === '/history';

  return (
    <div className="min-h-dvh pb-[calc(76px+env(safe-area-inset-bottom))] md:pb-0">
      <header className="sticky top-0 z-30 border-b-2 border-line bg-[color-mix(in_oklab,var(--c-bg)_88%,transparent)] backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-3 py-2">
          <Link
            to={rules.basePath === '' ? '/' : '/janes'}
            className="mr-auto flex items-baseline gap-1.5 font-display text-lg font-semibold no-underline text-ink"
          >
            <span aria-hidden="true">🎲</span>
            <span>
              Farkle<span className="text-accent">Me</span>Baby
            </span>
          </Link>

          <nav className="hidden md:flex" aria-label="Tools">
            <ul className="flex items-center gap-1">
              {TABS.map((tab) => (
                <li key={tab.suffix}>
                  <NavLink
                    to={pathIn(rules, tab.suffix)}
                    end={tab.suffix === '/'}
                    className={({ isActive }) =>
                      `inline-flex min-h-11 items-center rounded-xl px-3 font-semibold no-underline ${
                        isActive ? 'bg-accent-soft text-ink' : 'text-muted hover:bg-surface-2'
                      }`
                    }
                  >
                    {tab.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden md:block">
            <RuleSetSwitcher />
          </div>
          <ThemeToggle />
        </div>

        {/* On a phone the switcher gets its own full-width row — it has to be
            unmissable, and both rule sets need their whole name (§2.1). */}
        <div className="px-3 pb-2 md:hidden">
          <RuleSetSwitcher full />
        </div>

        {/* The active rule set, spelled out — never colour alone (§8). */}
        <div className="border-t border-accent-line bg-accent-soft">
          <p className="mx-auto flex max-w-4xl items-center gap-2 px-3 py-1 text-[13px] font-semibold">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
            <span>
              {rules.name} · {rules.diceCount} dice
            </span>
            <Link
              to={rules.id === 'standard' ? '/janes' : '/'}
              className="ml-auto text-[13px] font-semibold text-ink underline underline-offset-2"
            >
              {rules.id === 'standard' ? "What's different in Jane's?" : 'Standard rules'}
            </Link>
          </p>
        </div>
      </header>

      <main className={`mx-auto w-full px-3 py-4 ${isArticle ? 'max-w-2xl' : 'max-w-2xl'}`}>
        <Outlet />
      </main>

      <footer className="mx-auto max-w-2xl px-3 pt-6 pb-8 text-[14px] text-muted">
        <nav aria-label="More">
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <li>
              <Link to="/history" className="underline underline-offset-2">
                History of Farkle
              </Link>
            </li>
            <li>
              <Link to="/janes" className="underline underline-offset-2">
                Jane's Rules
              </Link>
            </li>
            <li>
              <Link to="/" className="underline underline-offset-2">
                Standard rules
              </Link>
            </li>
          </ul>
        </nav>
        <p className="mt-3">
          Everything is stored on this device only. No accounts, no tracking, no server.
        </p>
      </footer>

      <nav
        aria-label="Tools"
        className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-line bg-[color-mix(in_oklab,var(--c-bg)_94%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {TABS.map((tab) => (
            <li key={tab.suffix}>
              <NavLink
                to={pathIn(rules, tab.suffix)}
                end={tab.suffix === '/'}
                className={({ isActive }) =>
                  `flex min-h-[64px] flex-col items-center justify-center gap-0.5 text-[12px] font-semibold no-underline ${
                    isActive ? 'text-accent' : 'text-muted'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span aria-hidden="true" className="text-xl leading-none">
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                    <span
                      aria-hidden="true"
                      className={`h-0.5 w-6 rounded-full ${isActive ? 'bg-accent' : 'bg-transparent'}`}
                    />
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

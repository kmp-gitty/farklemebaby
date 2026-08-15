import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { STANDARD, type RuleSet } from '../lib/rules';
import { save } from '../lib/storage';

const RuleSetContext = createContext<RuleSet>(STANDARD);

export function RuleSetProvider({ rules, children }: { rules: RuleSet; children: ReactNode }) {
  useEffect(() => {
    save('farkle:lastRuleSet', rules.id);
    const root = document.documentElement;
    root.classList.toggle('rules-janes', rules.id === 'janes');
    root.classList.toggle('rules-standard', rules.id === 'standard');
    return () => {
      root.classList.remove('rules-janes', 'rules-standard');
    };
  }, [rules.id]);

  return <RuleSetContext.Provider value={rules}>{children}</RuleSetContext.Provider>;
}

/** Rule set comes from the route, never from a picker inside the page (§5.0). */
export function useRuleSet(): RuleSet {
  return useContext(RuleSetContext);
}

export type DieFace = 1 | 2 | 3 | 4 | 5 | 6;

export const FACES: DieFace[] = [1, 2, 3, 4, 5, 6];

export type RuleSet = {
  id: 'standard' | 'janes';
  name: string;
  /** Short label for the nav / switcher. */
  shortName: string;
  /** One-line description of the headline difference, used for cross-links. */
  tagline: string;
  diceCount: number;
  targetScore: number;
  entryThreshold: number;
  singles: Partial<Record<DieFace, number>>;
  triplets: Record<DieFace, number>;
  multiples: { four: number; five: number; six: number } | null;
  specials: {
    straight: number;
    threePairs: number;
    fourPlusPair: number;
    twoTriplets: number;
  } | null;
  /** Route prefix: '' for standard, '/janes' for Jane's. */
  basePath: '' | '/janes';
  /** localStorage key prefix, per §3.1. */
  storagePrefix: string;
  /** CSS class applied high in the tree to swap accent tokens. */
  themeClass: string;
};

export const STANDARD: RuleSet = {
  id: 'standard',
  name: 'Standard Rules',
  shortName: 'Standard',
  tagline: '6 dice, straights, three pairs and n-of-a-kind bonuses.',
  diceCount: 6,
  targetScore: 10_000,
  entryThreshold: 500,
  singles: { 1: 100, 5: 50 },
  triplets: { 1: 300, 2: 200, 3: 300, 4: 400, 5: 500, 6: 600 },
  multiples: { four: 1000, five: 2000, six: 3000 },
  specials: { straight: 1500, threePairs: 1500, fourPlusPair: 1500, twoTriplets: 2500 },
  basePath: '',
  storagePrefix: 'farkle:standard',
  themeClass: 'rules-standard',
};

export const JANES: RuleSet = {
  id: 'janes',
  name: "Jane's Rules",
  shortName: "Jane's",
  tagline: '11 dice. Triplets and single 1s and 5s only. Three 1s = 1,000.',
  diceCount: 11,
  targetScore: 10_000,
  entryThreshold: 500,
  singles: { 1: 100, 5: 50 },
  triplets: { 1: 1000, 2: 200, 3: 300, 4: 400, 5: 500, 6: 600 },
  multiples: null,
  specials: null,
  basePath: '/janes',
  storagePrefix: 'farkle:janes',
  themeClass: 'rules-janes',
};

export const RULE_SETS: Record<RuleSet['id'], RuleSet> = {
  standard: STANDARD,
  janes: JANES,
};

/** Maximum dice the roller offers, per §6.4. */
export const MAX_DICE = 11;

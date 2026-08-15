import type { RuleSet } from './rules';

export type CoachStep = { before: string; after?: string };

export type WalkthroughScript = {
  /** One entry per roll. Lengths must match what the previous roll leaves behind. */
  rolls: number[][];
  coach: Record<number, CoachStep>;
  /** Named in the "farkle you dodged" note if the player banks early. */
  finalRollWords: string;
};

/**
 * Scripted rounds. §6.2 allows fixed dice here and only here, so the round can
 * reach hot dice and a farkle on purpose — the UI says so plainly.
 */
export const WALKTHROUGHS: Record<RuleSet['id'], WalkthroughScript> = {
  standard: {
    rolls: [
      [1, 5, 2, 3, 4, 6], // two scoring dice — take only one
      [4, 4, 4, 1, 5], // everything scores → hot dice
      [3, 3, 3, 2, 4, 6], // the bank-or-roll decision
      [2, 3, 4], // farkle
    ],
    finalRollWords: '2, 3, 4',
    coach: {
      1: {
        before:
          'Six dice. Only the 1 and the 5 score here — the 2, 3, 4 and 6 are dead. Tap the 1 to set it aside. You could take the 5 as well, but leaving it means five dice to reroll instead of four, and that is often the better bet.',
        after: 'That 1 is worth 100, and it is safe for as long as you keep rolling.',
      },
      2: {
        before:
          'Triple 4s is 400, the 1 is another 100 and the 5 is 50. Take all five — every die on the table scores, which is worth doing here.',
        after:
          'All six dice have now been set aside, so you get the whole cup back and keep the 650. That is hot dice.',
      },
      3: {
        before:
          'Triple 3s would put you on 950 for the turn. This is the real Farkle decision: bank 950 now, or set the 3s aside and roll the last three dice for more.',
        after: 'Rolling on with three dice. Anything that scores keeps the turn alive.',
      },
      4: {
        before: 'Nothing here scores.',
        after:
          'That is a farkle: 2, 3 and 4 with no 1 and no 5. The entire 950 is gone and the turn is over. Banking at 950 would have been the safe call — knowing when to stop is the whole game.',
      },
    },
  },

  janes: {
    rolls: [
      [1, 1, 1, 5, 2, 2, 2, 3, 4, 6, 6], // 11 dice — leave a scoring triplet behind
      [1, 1, 1, 5, 5, 5, 5], // all seven score → hot dice
      [3, 3, 3, 6, 6, 6, 4, 4, 4, 2, 2], // three triplets, then the decision
      [2, 3], // farkle, only possible this far down
    ],
    finalRollWords: '2 and 3',
    coach: {
      1: {
        before:
          "Eleven dice, and Jane's headline change: three 1s is 1,000, not 300. There is also a triple 2s here for 200 and a single 5 for 50. Take the three 1s and the 5 — the 2s are only worth 200, and leaving them gives you seven dice to reroll instead of four.",
        after: '1,050 locked in for the turn, and seven dice back on the table.',
      },
      2: {
        before:
          'Three 1s again (1,000), three 5s (500), and a spare 5 (50). Every die on the table scores, so take all seven.',
        after:
          'All eleven dice have been set aside, so the whole cup comes back and you keep the 2,600. That is hot dice.',
      },
      3: {
        before:
          'Three 3s, three 6s and three 4s — 1,300, each triplet scored on its own at face value. Jane pays no bonus for having several, and no penalty either. Take all nine and you are on 3,900, with two dice left.',
        after:
          'Two dice. Up at nine dice or more a farkle is mathematically impossible; down here it is very much on.',
      },
      4: {
        before: 'Nothing here scores.',
        after:
          'That is a farkle: a 2 and a 3, no 1, no 5, no triplet. All 3,900 is gone. The opening roll of eleven could never have done that to you — under Jane’s rules the danger only arrives once you are down to eight dice or fewer.',
      },
    },
  },
};

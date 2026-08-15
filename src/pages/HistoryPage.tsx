import { LinkButton } from '../components/ui';

export function HistoryPage() {
  return (
    <article className="prose-article mx-auto">
      <h1 className="font-display text-4xl font-semibold">Nobody invented Farkle</h1>
      <p className="mt-2 text-lg text-muted">
        A short, honest history of a dice game with no author — and why your rules and your cousin's
        rules disagree.
      </p>

      <h2>A game with no author</h2>
      <p>
        Most games have a origin story with a name attached: someone sat down, worked out the rules,
        and sold them. Farkle doesn't. It is a folk game, handed along by word of mouth the way songs
        and card games and camp recipes are handed along, and by the time anyone thought to write it
        down there was no single version left to write.
      </p>
      <p>
        That matters more than it sounds. It explains the thing every new player runs into within
        about ten minutes: the rules on the box you own don't match the rules your family plays. Some
        tables score four of a kind, some don't. Some demand 500 to get on the board, some 350, some
        nothing at all. There is no authority to appeal to, because there was never an author. The
        rules are just what your table has agreed to, and that agreement is usually inherited.
      </p>

      <h2>The many names</h2>
      <p>
        The same push-your-luck dice game turns up under a long list of names: Ten Thousand, Dix
        Mille, Zilch, Zonk, Greed, Hot Dice, Squelch, Chicago, Volle Lotte and Cosmic Wimpout, among
        others. The details shift from name to name — different scoring tables, different targets,
        different words for a wiped turn — but the engine underneath is always the same. Roll, keep
        what scores, decide whether to stop. That decision is the entire game, and it has survived
        every translation.
      </p>

      <h2>How it probably got here</h2>
      <p>
        The most commonly cited account has the game arriving in North America aboard French sailing
        ships in the 1600s, spreading inland through families rather than through any commercial
        route. Supporting it: dice consistent with the game have been recovered at Fort de Chartres
        in Illinois, dated to the 1700s. That is a genuinely old presence for a game nobody was
        selling.
      </p>
      <p>
        It is worth being careful with how firmly that story gets told. Dice games are almost
        impossible to trace, because the equipment is generic and the rules live in people's heads.
        What can be said with confidence is that games of this shape are old, that they were being
        played in North America long before anyone printed a rulebook, and that the French-ships
        account is the version most sources repeat.
      </p>

      <h2>The stories that aren't true</h2>
      <p>
        Two origin myths follow Farkle around, and both are good enough to be worth telling as long
        as nobody mistakes them for history.
      </p>
      <p>
        The first is Sir Albert Farkle, an English nobleman said to have played the game in Iceland
        somewhere in the 1300s or 1400s. No such person appears in any record. The story has the
        texture of something invented to explain a funny word.
      </p>
      <p>
        The second is Texan: that the game is named for the farkleberry, a hard little fruit that
        dries into something you could allegedly roll like a die. The <em>Texas Monthly</em> Texanist
        column has entertained this one at length. It is folklore too. Farkleberries are real; the
        etymology is not established.
      </p>
      <p>
        Both stories persist for the same reason: "Farkle" sounds like it ought to come from
        somewhere specific. It probably just comes from the sound of losing.
      </p>

      <h2>Going commercial, late</h2>
      <p>
        The boxed versions came along very recently compared to the game itself. Legendary Games
        published Pocket Farkel in 1996. Patch Products brought out a mass-market Farkle in 2007,
        which is the edition most people picture when they picture a box. The trademark is a couple
        of decades old. The game is centuries older than that, and none of the commercial editions
        can claim to be the original, because there isn't one.
      </p>
      <p>
        This is why a boxed rules card is best read as one table's version, formalised and printed. A
        good one, usually. But not the last word.
      </p>

      <h2>Which brings us to Jane</h2>
      <p>
        Every family that plays this game has bent it. Someone decided a straight should be worth
        something, or that four of a kind should end the turn, or that three 1s deserves more respect
        than 300 points, and the table agreed, and thirty years later that is simply how the game is
        played in that house.
      </p>
      <p>
        Jane's Rules on this site are exactly that: a real house variant, played with eleven dice,
        scoring nothing but triplets and single 1s and 5s, and paying a thousand for three 1s. They
        aren't a correction of the standard rules. They're another branch of the same oral tradition
        that got the game here in the first place — which is the most Farkle thing about them.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <LinkButton to="/janes" size="sm">
          Read Jane's Rules
        </LinkButton>
        <LinkButton to="/" variant="secondary" size="sm">
          Standard rules
        </LinkButton>
      </div>

      <h2>Further reading</h2>
      <ul>
        <li>
          <a href="https://en.wikipedia.org/wiki/Farkle" target="_blank" rel="noreferrer">
            Farkle on Wikipedia
          </a>{' '}
          — the names, the variants, and the commercial editions.
        </li>
        <li>
          <a
            href="https://www.texasmonthly.com/articles/the-texanist-farkleberry/"
            target="_blank"
            rel="noreferrer"
          >
            The Texanist on farkleberries
          </a>{' '}
          — <em>Texas Monthly</em> on the fruit, and the theory named after it.
        </li>
      </ul>
    </article>
  );
}

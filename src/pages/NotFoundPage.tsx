import { Card, LinkButton } from '../components/ui';

export function NotFoundPage() {
  return (
    <Card className="space-y-3 text-center">
      <h1 className="font-display text-3xl font-semibold">Farkle.</h1>
      <p className="text-[16px] text-muted">
        Nothing scores at this address. The turn passes to the next page.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <LinkButton to="/">Rules</LinkButton>
        <LinkButton to="/play" variant="secondary">
          Play
        </LinkButton>
        <LinkButton to="/score" variant="secondary">
          Score Pad
        </LinkButton>
        <LinkButton to="/dice" variant="secondary">
          Dice
        </LinkButton>
      </div>
    </Card>
  );
}

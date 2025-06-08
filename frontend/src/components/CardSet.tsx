import { Card } from "@mui/material";
import PlayingCard, { type PlayingCardProps } from "./PlayingCard";

interface CardSetProps {
  cards: PlayingCardProps[] | null;
  maxCards: number;
}

function CardSet({ cards, maxCards }: CardSetProps) {
  function playingCards(cards: PlayingCardProps[]) {
    return cards.map((cardProps) => (
      <PlayingCard suit={cardProps.suit} rank={cardProps.rank} />
    ));
  }

  const width = maxCards * 6 + (maxCards + 1) * 0.7;

  return (
    <Card
      sx={{
        display: "flex",
        columnGap: "0.7em",
        width: `${width}em`,
        height: "10.4em",
        backgroundColor: "forestgreen",
        padding: "0.7em",
        alignItems: "center",
      }}
    >
      {cards && playingCards(cards)}
    </Card>
  );
}

export { CardSet as default, type CardSetProps };

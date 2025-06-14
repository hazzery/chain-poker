import { Card } from "@mui/material";
import PlayingCard, { RANKS, Suit } from "./PlayingCard";

interface CardSetProps {
  cards: number[] | null;
  maxCards: number;
}

function CardSet({ cards, maxCards }: CardSetProps) {
  function playingCards(cards: number[]) {
    return cards.map((cardId) => {
      const suit = Math.floor(cardId / 13) as Suit;
      const rank = RANKS[cardId % 13];

      return <PlayingCard suit={suit} rank={rank} />;
    });
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

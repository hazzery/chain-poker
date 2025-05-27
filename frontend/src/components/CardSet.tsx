import { Card } from "@mui/material";
import PlayingCard, { type PlayingCardProps } from "./PlayingCard";

export interface CardSetProps {
  cards: PlayingCardProps[];
}

function playingCards(cards: PlayingCardProps[]) {
  return cards.map((cardProps) => (
    <PlayingCard suit={cardProps.suit} rank={cardProps.rank} />
  ));
}

export function CardSet({ cards }: CardSetProps) {
  return (
    <Card
      sx={{
        display: "inline-flex",
        columnGap: "10px",
        backgroundColor: "darkgrey",
        padding: "10px",
      }}
    >
      {playingCards(cards)}
    </Card>
  );
}

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
        // display: "inline-flex",
        display: "flex",
        columnGap: "0.7em",
        // backgroundColor: "burlywood",
        backgroundColor: "forestgreen",
        padding: "0.7em",
        alignItems: "center",
      }}
    >
      {playingCards(cards)}
    </Card>
  );
}

import { Card } from "@mui/material";

import { ChipCount } from "../ChipCount";
import { CardSet } from "./CardSet";
import { type PlayingCardProps } from "./PlayingCard";

export interface HandProps {
  cards: PlayingCardProps[];
}

export function Hand({ cards }: HandProps) {
  return (
    <Card
      sx={{
        backgroundColor: "gainsboro",
        display: "flex",
        flexGrow: 0,
        flexShrink: 0,
        justifyContent: "center",
        borderRadius: "0.4em",
        margin: "1em",
        padding: "0.5em",
      }}
    >
      <ChipCount
        numberOfChips={97.5}
        chipIconSize="6em"
        fontSize="2em"
        sx={{
          position: "fixed",
          left: "2em",
          height: "11em",
        }}
      />
      <CardSet cards={cards} />
    </Card>
  );
}

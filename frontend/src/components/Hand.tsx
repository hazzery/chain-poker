import { Card, useTheme } from "@mui/material";

import type { ComponentChildren } from "preact";
import { uScrtToScrt } from "../secretnetwork/utils";
import CardSet from "./CardSet";
import { ChipCount } from "./ChipCount";

interface HandProps {
  cards: number[] | null;
  chipBalance: bigint;
  children?: ComponentChildren;
}

function Hand({ cards, chipBalance, children }: HandProps) {
  const theme = useTheme();
  return (
    <Card
      sx={{
        backgroundColor: theme.palette.mode === "dark" ? "black" : "gainsboro",
        display: "flex",
        flexGrow: 0,
        flexShrink: 0,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: "0.4em",
        margin: "1em",
        padding: "0.5em",
      }}
    >
      <ChipCount
        numberOfChips={uScrtToScrt(chipBalance)}
        chipIconSize="6em"
        fontSize="2em"
        sx={{
          position: "fixed",
          left: "2em",
        }}
      />
      <CardSet cards={cards} maxCards={2} />
      {children}
    </Card>
  );
}

export default Hand;

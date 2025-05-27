import { Box, Typography } from "@mui/material";
import { PiPokerChipDuotone } from "react-icons/pi";

import { type PlayingCardProps } from "./PlayingCard";
import { CardSet } from "./CardSet";

export interface HandProps {
  cards: PlayingCardProps[];
}

export function Hand({ cards }: HandProps) {
  return (
    <>
      <Box
        width="100%"
        display="flex"
        position="fixed"
        bottom={0}
        justifyContent="space-between"
        alignItems="center"
        marginLeft="20px"
      >
        <PiPokerChipDuotone size={100} />
        <Typography fontSize={30}>1000</Typography>
        <Box display="flex" flexGrow={1} justifyContent="center">
          <CardSet cards={cards} />
        </Box>
      </Box>
    </>
  );
}

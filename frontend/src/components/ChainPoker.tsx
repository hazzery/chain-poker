import { Box, Typography } from "@mui/material";
import type { ComponentChildren, VNode } from "preact";
import { GiPokerHand } from "react-icons/gi";

interface ChainPokerProps {
  children: ComponentChildren;
}

function ChainPoker({ children }: ChainPokerProps): VNode {
  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <Box display="flex" alignItems="center" marginTop="5em">
        <GiPokerHand size="20em" />
        <Typography fontSize="5em">Chain Poker</Typography>
      </Box>
      <Box
        sx={{
          padding: "2em",
          display: "flex",
          flexDirection: "column",
          columnGap: "1em",
          rowGap: "1em",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default ChainPoker;

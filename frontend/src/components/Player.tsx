import { Box, Card, Typography, type SxProps } from "@mui/material";
import { IoIosRadioButtonOn } from "react-icons/io";

import { ChipCount } from "./ChipCount";

interface PlayerProps {
  name: string;
  chipBalance: string;
  isCurrentTurn?: boolean;
  hasButton?: boolean;
  sx?: SxProps;
}

function Player({
  name,
  chipBalance,
  isCurrentTurn,
  hasButton,
  sx,
}: PlayerProps) {
  return (
    <Card
      sx={{
        display: "inline-flex",
        flexDirection: "column",
        backgroundColor: isCurrentTurn ? "lightgreen" : "gainsboro",
        padding: "0.7em",
        alignItems: "center",
        overflow: "visible",
        ...sx,
      }}
    >
      {hasButton && (
        <Box position="absolute" top={-15} left={-15}>
          <IoIosRadioButtonOn size={40} />
        </Box>
      )}
      <Typography fontSize="1.6em">{name}</Typography>
      <ChipCount
        numberOfChips={chipBalance}
        chipIconSize="2em"
        fontSize="1.3em"
      />
    </Card>
  );
}

export { Player as default, type PlayerProps };

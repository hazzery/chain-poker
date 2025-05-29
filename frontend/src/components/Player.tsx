import { Card, Typography, type SxProps } from "@mui/material";
import { ChipCount } from "../ChipCount";

export interface PlayerProps {
  name: string;
  chipBalance: number;
  sx?: SxProps;
}

export function Player({ name, chipBalance, sx }: PlayerProps) {
  return (
    <Card
      sx={{
        position: "absolute",
        transform: "translate(-50%, -50%)",
        display: "inline-flex",
        flexDirection: "column",
        backgroundColor: "gainsboro",
        padding: "0.7em",
        alignItems: "center",
        ...sx,
      }}
    >
      <Typography fontSize="1.6em">{name}</Typography>
      <ChipCount
        numberOfChips={chipBalance}
        chipIconSize="2em"
        fontSize="1.3em"
      />
    </Card>
  );
}

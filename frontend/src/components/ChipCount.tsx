import { Box, Typography, type SxProps } from "@mui/material";
import { PiPokerChipDuotone } from "react-icons/pi";

export interface ChipCountProps {
  numberOfChips: number;
  chipIconSize: string;
  fontSize: string;
  sx?: SxProps;
}

export function ChipCount({
  numberOfChips,
  chipIconSize,
  fontSize,
  sx,
}: ChipCountProps) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        ...sx,
      }}
    >
      <PiPokerChipDuotone size={chipIconSize} />
      <Typography fontSize={fontSize} noWrap>
        {numberOfChips} SCRT
      </Typography>
    </Box>
  );
}

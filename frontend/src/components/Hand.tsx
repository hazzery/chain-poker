import { Box, Button, Card, TextField } from "@mui/material";

import { ChipCount } from "./ChipCount";
import { CardSet } from "./CardSet";
import { type PlayingCardProps } from "./PlayingCard";
import scrtLogo from "../../resources/scrt.svg";
import type { ChangeEvent } from "preact/compat";
import useNumberValidation from "../hooks/useNumberValidation";

export interface HandProps {
  cards: PlayingCardProps[];
  chipBalance: number;
}

function placeBet(): void {}

export function Hand({ cards, chipBalance }: HandProps) {
  const [betAmount, setBetAmount] = useNumberValidation({
    minValue: 0,
    maxValue: chipBalance,
  });

  return (
    <Card
      sx={{
        backgroundColor: "gainsboro",
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
        numberOfChips={chipBalance}
        chipIconSize="6em"
        fontSize="2em"
        sx={{
          position: "fixed",
          left: "2em",
        }}
      />
      <CardSet cards={cards} />
      <Box
        sx={{ position: "fixed", right: "2em" }}
        display="flex"
        columnGap="1em"
        justifyContent="center"
      >
        <TextField
          value={betAmount.value}
          label="Bet Value"
          color="success"
          error={Boolean(betAmount.error)}
          helperText={betAmount.error}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setBetAmount(event.target?.value)
          }
          variant="outlined"
          slotProps={{
            input: { startAdornment: <img src={scrtLogo} width="20em" /> },
          }}
        ></TextField>
        <Button variant="contained" color="success" onClick={placeBet}>
          Place Bet
        </Button>
      </Box>
    </Card>
  );
}

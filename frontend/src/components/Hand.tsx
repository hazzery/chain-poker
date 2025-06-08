import { Box, Button, Card, TextField } from "@mui/material";

import scrtLogo from "../../resources/scrt.svg";
import useNumberValidation from "../hooks/useNumberValidation";
import CardSet from "./CardSet";
import { ChipCount } from "./ChipCount";
import { type PlayingCardProps } from "./PlayingCard";

interface HandProps {
  cards: PlayingCardProps[] | null;
  chipBalance: number;
  ourTurn: boolean;
}

function placeBet(): void {}

function Hand({ cards, chipBalance, ourTurn }: HandProps) {
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
      <CardSet cards={cards} maxCards={2} />
      {ourTurn && (
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
            onChange={(event) => setBetAmount(event.target.value)}
            variant="outlined"
            slotProps={{
              input: { startAdornment: <img src={scrtLogo} width="20em" /> },
              htmlInput: { sx: { paddingLeft: "0.4em" } },
            }}
          ></TextField>
          <Button onClick={placeBet} variant="outlined" color="success">
            Place Bet
          </Button>
        </Box>
      )}
    </Card>
  );
}

export default Hand;

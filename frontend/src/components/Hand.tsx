import { Box, Button, Card } from "@mui/material";

import useNumberValidation from "../hooks/useNumberValidation";
import CardSet from "./CardSet";
import { ChipCount } from "./ChipCount";
import ScrtInput from "./ScrtInput";

interface HandProps {
  cards: number[] | null;
  chipBalance: number;
  minBet: number;
  ourTurn: boolean;
  onBet: (_: number) => void;
}

function Hand({ cards, chipBalance, minBet, ourTurn, onBet }: HandProps) {
  const [betAmount, setBetAmount] = useNumberValidation({
    required: true,
    minValue: minBet,
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
          <ScrtInput
            state={betAmount}
            setState={setBetAmount}
            color="success"
          />
          <Button
            onClick={() => onBet(Number(betAmount.value))}
            disabled={betAmount.error !== null}
            variant="outlined"
            color="success"
          >
            Place Bet
          </Button>
        </Box>
      )}
    </Card>
  );
}

export default Hand;

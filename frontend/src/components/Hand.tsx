import { Box, Button, Card } from "@mui/material";

import useScrtValidation from "../hooks/useScrtValidation";
import CardSet from "./CardSet";
import { ChipCount } from "./ChipCount";
import ScrtInput from "./ScrtInput";

interface HandProps {
  cards: number[] | null;
  chipBalance: bigint;
  minBet: bigint;
  ourTurn: boolean;
  onBet: (betAmount: bigint) => void;
}

function Hand({ cards, chipBalance, minBet, ourTurn, onBet }: HandProps) {
  const [betAmount, setBetAmount] = useScrtValidation({
    minValueUscrt: minBet,
    maxValueUscrt: chipBalance,
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
            onClick={() => onBet(betAmount.uScrt!)}
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

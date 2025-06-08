import { Box, Button } from "@mui/material";
import type { VNode } from "preact";

import type { SecretNetworkClient } from "secretjs";
import TextInput from "../components/TextInput";
import useNumberValidation from "../hooks/useNumberValidation";
import { buyIn } from "../secretnetwork/chainPokerContract";

interface BuyInProps {
  lobbyCode: string;
  minBuyIn: number;
  maxBuyIn: number;
  onBuyIn: () => void;
  networkClient: SecretNetworkClient;
}

function BuyIn({
  lobbyCode,
  maxBuyIn,
  minBuyIn,
  networkClient,
  onBuyIn,
}: BuyInProps): VNode | undefined {
  const [buyInAmount, setBuyInAmount] = useNumberValidation({
    required: true,
    maxValue: maxBuyIn,
    minValue: minBuyIn,
  });

  async function handleBuyIn() {
    await buyIn(Number(buyInAmount.value), lobbyCode, networkClient)
      .onSuccess(onBuyIn)
      .onFailure(console.error);
  }

  return (
    <Box display="flex" flexDirection="column" rowGap="1em">
      <TextInput
        required
        state={buyInAmount}
        setState={setBuyInAmount}
        label="Buy in amount (SCRT)"
        variant="outlined"
        color="success"
      />
      <Button
        disabled={buyInAmount.error !== null}
        onClick={handleBuyIn}
        variant="outlined"
        color="success"
        sx={{ marginX: "1em" }}
      >
        Buy in
      </Button>
    </Box>
  );
}

export default BuyIn;

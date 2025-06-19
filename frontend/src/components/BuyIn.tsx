import { Box, Button } from "@mui/material";
import type { VNode } from "preact";

import type { SecretNetworkClient } from "secretjs";
import TextInput from "../components/TextInput";
import useScrtValidation from "../hooks/useScrtValidation";
import useStringValidation from "../hooks/useStringValidation";
import { buyIn } from "../secretnetwork/chainPokerContract";
import ScrtInput from "./ScrtInput";

interface BuyInProps {
  lobbyCode: string;
  minBuyIn: bigint;
  maxBuyIn: bigint;
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
  const [buyInAmount, setBuyInAmount] = useScrtValidation({
    maxValueUscrt: maxBuyIn,
    minValueUscrt: minBuyIn,
  });
  const [username, setUsername] = useStringValidation({
    required: true,
    maxLength: 15,
    minLength: 3,
  });

  async function handleBuyIn() {
    await buyIn(username.value, buyInAmount.uScrt!, lobbyCode, networkClient)
      .onSuccess(() => localStorage.setItem("username", username.value))
      .onSuccess(onBuyIn)
      .onFailure(console.error);
  }

  return (
    <Box display="flex" flexDirection="column" rowGap="1em">
      <TextInput
        required
        state={username}
        setState={setUsername}
        label="Username"
        variant="outlined"
        color="success"
      />
      <ScrtInput
        required
        state={buyInAmount}
        setState={setBuyInAmount}
        label="Buy in amount (SCRT)"
        variant="outlined"
        color="success"
      />
      <Button
        disabled={username.error !== null || buyInAmount.error !== null}
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

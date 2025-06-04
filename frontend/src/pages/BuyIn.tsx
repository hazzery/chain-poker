import { Box, Button, Typography } from "@mui/material";
import type { JSX, VNode } from "preact";
import { useLocation, useRoute } from "preact-iso";

import TextInput from "../components/TextInput";
import useNumberValidation from "../hooks/useNumberValidation";
import { buyIn } from "../secretnetwork/chainPokerContract";
import { useNetworkClient } from "../secretnetwork/SecretNetworkContext";
import { GiPokerHand } from "react-icons/gi";

function BuyIn(): VNode | undefined {
  const location = useLocation();
  const networkClient = useNetworkClient().networkClient;
  if (networkClient === null) {
    console.error("Network client from context was null");
    location.route("/");
    return;
  }

  const { lobbyCode } = useRoute().params;
  const [buyInAmount, setBuyInAmount] = useNumberValidation({
    integer: true,
    required: true,
  });

  async function handleSubmit(event: JSX.TargetedSubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    await buyIn(Number(buyInAmount.value), lobbyCode, networkClient!)
      .onSuccess(console.log)
      .onSuccess(() => location.route(`/play/${lobbyCode}`))
      .onFailure(console.error);
  }

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
        <Box
          component="form"
          onSubmit={handleSubmit}
          display="flex"
          flexDirection="column"
          rowGap="1em"
          width="16em"
        >
          <TextInput
            required
            state={buyInAmount}
            setState={setBuyInAmount}
            label="Buy in amount (SCRT)"
            variant="outlined"
            color="success"
          />
          <Button
            type="submit"
            disabled={buyInAmount.error !== null}
            variant="outlined"
            color="success"
          >
            Buy in
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default BuyIn;

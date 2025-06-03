import { Box, Button } from "@mui/material";
import type { JSX, VNode } from "preact";
import { useLocation } from "preact-iso";
import type { SecretNetworkClient } from "secretjs";
import useNumberValidation from "../hooks/useNumberValidation";
import { createLobby } from "../secretnetwork/chainPokerContract";
import TextInput from "./TextInput";

interface CreateLobbyProps {
  backAction: () => void;
  networkClient: SecretNetworkClient;
}

function CreateLobby({ backAction, networkClient }: CreateLobbyProps): VNode {
  const location = useLocation();
  const [bigBlind, setBigBlind] = useNumberValidation({
    integer: true,
    required: true,
  });
  const [minBuyInBB, setMinBuyInBB] = useNumberValidation({
    integer: true,
    required: true,
  });
  const [maxBuyInBB, setMaxBuyInBB] = useNumberValidation({
    integer: true,
    required: true,
  });

  async function handleSubmit(event: JSX.TargetedSubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      bigBlind.error !== null ||
      minBuyInBB.error !== null ||
      maxBuyInBB.error !== null
    ) {
      return;
    }

    await createLobby(
      {
        big_blind: Number(bigBlind.value),
        min_buy_in_bb: Number(minBuyInBB.value),
        max_buy_in_bb: Number(maxBuyInBB.value),
      },
      networkClient,
    )
      .onSuccess(console.dir)
      .onSuccess(() => location.route("/play"))
      .onFailure(console.dir);
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      display="flex"
      flexDirection="column"
      rowGap="1em"
      width="20em"
    >
      <TextInput
        required
        fullWidth
        state={bigBlind}
        setState={setBigBlind}
        label="Big blind value (SCRT)"
        variant="outlined"
        color="success"
      />
      <TextInput
        required
        fullWidth
        state={maxBuyInBB}
        setState={setMaxBuyInBB}
        label="Maximum buy in (number of big blinds)"
        variant="outlined"
        color="success"
      />
      <TextInput
        required
        fullWidth
        state={minBuyInBB}
        setState={setMinBuyInBB}
        label="Minimum buy in (number of big blinds)"
        variant="outlined"
        color="success"
      />
      <Button
        fullWidth
        disabled={
          bigBlind.error !== null ||
          minBuyInBB.error !== null ||
          maxBuyInBB.error !== null
        }
        type="submit"
        variant="outlined"
        color="success"
      >
        Create
      </Button>
      <Button
        onClick={backAction}
        variant="outlined"
        color="inherit"
        sx={{ width: "6em" }}
      >
        Back
      </Button>
    </Box>
  );
}

export default CreateLobby;

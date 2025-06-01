import { Box, Button } from "@mui/material";
import type { JSX, ReactNode } from "preact/compat";
import useNumberValidation from "../hooks/useNumberValidation";
import { createLobby } from "../secretnetwork/chainPokerContract";
import type { SecretNetworkState } from "../secretnetwork/secretNetworkState";
import TextInput from "./TextInput";

interface CreateLobbyProps {
  backAction: () => void;
  networkState: SecretNetworkState;
}

function CreateLobby({
  backAction,
  networkState,
}: CreateLobbyProps): ReactNode {
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
        big_blind: bigBlind.value,
        min_buy_in_bb: minBuyInBB.value,
        max_buy_in_bb: maxBuyInBB.value,
      },
      networkState,
    )
      .onSuccess(console.dir)
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

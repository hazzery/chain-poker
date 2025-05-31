import { Box, Button } from "@mui/material";
import { useState, type ReactNode } from "preact/compat";
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

  async function handleCreate() {
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
      onSubmit={handleCreate}
      display="flex"
      flexDirection="column"
      rowGap="1em"
      width="16em"
    >
      <TextInput
        required
        fullWidth
        label="Big blind value (SCRT)"
        variant="outlined"
        state={bigBlind}
        setState={setBigBlind}
      />
      <TextInput
        required
        fullWidth
        label="Maximum buy in (number of big blinds)"
        variant="outlined"
        state={maxBuyInBB}
        setState={setMaxBuyInBB}
      />
      <TextInput
        required
        fullWidth
        label="Minimum buy in (number of big blinds)"
        variant="outlined"
        state={minBuyInBB}
        setState={setMinBuyInBB}
      />
      <Button
        disabled={
          bigBlind.error !== null ||
          minBuyInBB.error !== null ||
          maxBuyInBB.error !== null
        }
        fullWidth
        variant="outlined"
        color="success"
        onClick={handleCreate}
      >
        Create
      </Button>
      <Button
        variant="outlined"
        color="inherit"
        sx={{ width: "6em" }}
        onClick={backAction}
      >
        Back
      </Button>
    </Box>
  );
}

export default CreateLobby;

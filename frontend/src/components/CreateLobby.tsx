import { Box, Button, TextField } from "@mui/material";
import { type ReactNode } from "preact/compat";
import useNumberValidation from "../hooks/useNumberValidation";
import { createLobby } from "../secretnetwork/chainPokerContract";
import type { SecretNetworkState } from "../secretnetwork/secretNetworkState";

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
      <TextField
        required
        fullWidth
        error={minBuyInBB.error !== null}
        helperText={minBuyInBB.error}
        value={minBuyInBB.value}
        onChange={(event) => setMinBuyInBB(event.target.value)}
        variant="outlined"
        label="Minimum buy in (number of big blinds)"
      ></TextField>
      <TextField
        required
        fullWidth
        error={maxBuyInBB.error !== null}
        helperText={maxBuyInBB.error}
        value={maxBuyInBB.value}
        onChange={(event) => setMaxBuyInBB(event.target.value)}
        variant="outlined"
        label="Maximum buy in (number of big blinds)"
      ></TextField>
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

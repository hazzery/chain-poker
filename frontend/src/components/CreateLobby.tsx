import { Box, Button } from "@mui/material";
import type { VNode } from "preact";
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
  const [bigBlind, setBigBlind] = useNumberValidation({ required: true });
  const [minBuyInBB, setMinBuyInBB] = useNumberValidation({ required: true });
  const [maxBuyInBB, setMaxBuyInBB] = useNumberValidation({ required: true });

  async function handleCreateLobby() {
    await createLobby(
      {
        big_blind: Number(bigBlind.value),
        min_buy_in_bb: Number(minBuyInBB.value),
        max_buy_in_bb: Number(maxBuyInBB.value),
      },
      networkClient,
    )
      .onSuccess((lobbyCode) => location.route(`/lobby/${lobbyCode}`))
      .onFailure(console.dir);
  }

  return (
    <Box display="flex" flexDirection="column" rowGap="1em" width="20em">
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
        onClick={handleCreateLobby}
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

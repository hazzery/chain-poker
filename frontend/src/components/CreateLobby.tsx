import { Box, Button, Divider } from "@mui/material";
import type { VNode } from "preact";
import { useLocation } from "preact-iso";
import type { SecretNetworkClient } from "secretjs";

import { useState } from "preact/hooks";
import useNumberValidation from "../hooks/useNumberValidation";
import { buyIn, createLobby } from "../secretnetwork/chainPokerContract";
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
  const [lobbyCode, setLobbyCode] = useState<string | null>(null);
  const [buyInAmount, setBuyInAmount] = useNumberValidation({
    required: true,
    maxValue: Number(maxBuyInBB.value) * Number(bigBlind.value),
    minValue: Number(minBuyInBB.value) * Number(bigBlind.value),
  });

  async function handleBuyIn() {
    await buyIn(Number(buyInAmount.value), lobbyCode!, networkClient)
      .onSuccess(() => location.route(`/play/${lobbyCode}`))
      .onFailure(console.dir);
  }

  async function handleCreateLobby() {
    await createLobby(
      {
        big_blind: Number(bigBlind.value),
        min_buy_in_bb: Number(minBuyInBB.value),
        max_buy_in_bb: Number(maxBuyInBB.value),
      },
      networkClient,
    )
      .onSuccess(setLobbyCode)
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
        disabled={lobbyCode !== null}
        variant="outlined"
        color="success"
      />
      <TextInput
        required
        fullWidth
        state={maxBuyInBB}
        setState={setMaxBuyInBB}
        label="Maximum buy in (number of big blinds)"
        disabled={lobbyCode !== null}
        variant="outlined"
        color="success"
      />
      <TextInput
        required
        fullWidth
        state={minBuyInBB}
        setState={setMinBuyInBB}
        label="Minimum buy in (number of big blinds)"
        disabled={lobbyCode !== null}
        variant="outlined"
        color="success"
      />
      <Button
        fullWidth
        disabled={
          bigBlind.error !== null ||
          minBuyInBB.error !== null ||
          maxBuyInBB.error !== null ||
          lobbyCode !== null
        }
        onClick={handleCreateLobby}
        variant="outlined"
        color="success"
      >
        Create
      </Button>
      <Divider sx={{ display: lobbyCode !== null ? "inline" : "none" }} />
      <TextInput
        required
        fullWidth
        state={buyInAmount}
        setState={setBuyInAmount}
        label="Buy in amount"
        color="success"
        sx={{ display: lobbyCode !== null ? "inline" : "none" }}
      />
      <Button
        fullWidth
        disabled={buyInAmount.error !== null}
        onClick={handleBuyIn}
        variant="outlined"
        color="success"
        sx={{ display: lobbyCode !== null ? "inline" : "none" }}
      >
        Buy in
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

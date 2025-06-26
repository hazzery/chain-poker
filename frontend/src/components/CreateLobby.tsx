import { Box, Button } from "@mui/material";
import type { VNode } from "preact";
import { useLocation } from "preact-iso";
import type { SecretNetworkClient } from "secretjs";

import useNumberValidation from "../hooks/useNumberValidation";
import useStringValidation from "../hooks/useStringValidation";
import { createLobby } from "../secretnetwork/chainPokerContract";
import TextInput from "./TextInput";
import ScrtInput from "./ScrtInput";
import useScrtValidation from "../hooks/useScrtValidation";

interface CreateLobbyProps {
  backAction: () => void;
  networkClient: SecretNetworkClient;
}

function CreateLobby({ backAction, networkClient }: CreateLobbyProps): VNode {
  const location = useLocation();
  const [username, setUsername] = useStringValidation({
    required: true,
    minLength: 3,
    maxLength: 15,
  });
  const [bigBlind, setBigBlind] = useScrtValidation({
    minValueUscrt: 2n,
    maxValueUscrt: (1n << 32n) - 1n, // bigBlind is a u32 in the contract
  });
  const [minBuyInBB, setMinBuyInBB] = useNumberValidation({
    required: true,
    minValue: 1,
    maxValue: 255, // stored as a u8 in the contract
  });
  const [maxBuyInBB, setMaxBuyInBB] = useNumberValidation({
    required: true,
    minValue: Math.max(minBuyInBB.number, 1),
    maxValue: 255, // stored as a u8 in the contract
  });

  async function handleCreateLobby() {
    await createLobby(
      username.value,
      bigBlind.uScrt!,
      minBuyInBB.number,
      maxBuyInBB.number,
      networkClient,
    )
      .onSuccess(() => localStorage.setItem("username", username.value))
      .onSuccess((lobbyCode) => location.route(`/lobby/${lobbyCode}`))
      .onFailure(console.dir);
  }

  return (
    <Box display="flex" flexDirection="column" rowGap="1em" width="20em">
      <TextInput
        required
        fullWidth
        state={username}
        setState={setUsername}
        label="Username"
      />
      <ScrtInput
        required
        fullWidth
        state={bigBlind}
        setState={setBigBlind}
        label="Big blind value (SCRT)"
      />
      <TextInput
        required
        fullWidth
        state={maxBuyInBB}
        setState={setMaxBuyInBB}
        label="Maximum buy in (number of big blinds)"
      />
      <TextInput
        required
        fullWidth
        state={minBuyInBB}
        setState={setMinBuyInBB}
        label="Minimum buy in (number of big blinds)"
      />
      <Button
        fullWidth
        disabled={
          username.error !== null ||
          bigBlind.error !== null ||
          minBuyInBB.error !== null ||
          maxBuyInBB.error !== null
        }
        onClick={handleCreateLobby}
      >
        Create
      </Button>
      <Button onClick={backAction} color="inherit" sx={{ width: "6em" }}>
        Back
      </Button>
    </Box>
  );
}

export default CreateLobby;

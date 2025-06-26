import { Box, Button } from "@mui/material";
import type { VNode } from "preact";
import { useLocation } from "preact-iso";
import type { SecretNetworkClient } from "secretjs";

import useStringValidation from "../hooks/useStringValidation";
import TextInput from "./TextInput";

interface JoinLobbyProps {
  backAction: () => void;
  networkClient: SecretNetworkClient;
}

function JoinLobby({ backAction }: JoinLobbyProps): VNode {
  const location = useLocation();
  const [lobbyCode, setLobbyCode] = useStringValidation({
    required: true,
    minLength: 45,
    maxLength: 45,
  });

  async function handleJoin() {
    location.route(`/lobby/${lobbyCode.value}`);
  }

  return (
    <Box display="flex" flexDirection="column" rowGap="1em" width="16em">
      <TextInput
        required
        state={lobbyCode}
        setState={setLobbyCode}
        label={"Lobby code"}
      />
      <Button onClick={handleJoin} disabled={lobbyCode.error !== null}>
        Join
      </Button>
      <Button
        onClick={backAction}
        color="inherit"
        sx={{ width: "6em" }}
      >
        Back
      </Button>
    </Box>
  );
}

export default JoinLobby;

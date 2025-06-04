import { Box, Button } from "@mui/material";
import type { JSX, VNode } from "preact";
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

  async function handleSubmit(event: JSX.TargetedSubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    location.route(`/play/${lobbyCode.value}/buy-in`);
  }

  return (
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
        state={lobbyCode}
        setState={setLobbyCode}
        label={"Lobby code"}
        variant="outlined"
        color="success"
      />
      <Button
        type="submit"
        disabled={lobbyCode.error !== null}
        variant="outlined"
        color="success"
      >
        Join
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

export default JoinLobby;

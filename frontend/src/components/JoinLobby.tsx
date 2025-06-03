import { Box, Button } from "@mui/material";
import type { JSX, VNode } from "preact";
import { useLocation } from "preact-iso";
import type { SecretNetworkClient } from "secretjs";
import useNumberValidation from "../hooks/useNumberValidation";
import useStringValidation from "../hooks/useStringValidation";
import { buyIn } from "../secretnetwork/chainPokerContract";
import TextInput from "./TextInput";

interface JoinLobbyProps {
  backAction: () => void;
  networkClient: SecretNetworkClient;
}

function JoinLobby({ backAction, networkClient }: JoinLobbyProps): VNode {
  const location = useLocation();
  const [lobbyCode, setLobbyCode] = useStringValidation({
    required: true,
    minLength: 45,
    maxLength: 45,
  });
  const [buyInAmount, setBuyInAmount] = useNumberValidation({
    integer: true,
    required: true,
  });

  async function handleSubmit(event: JSX.TargetedSubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (buyInAmount.error !== null) {
      return;
    }

    await buyIn(Number(buyInAmount.value), lobbyCode.value, networkClient)
      .onSuccess(console.log)
      .onSuccess(() => location.route("/play"))
      .onFailure(console.error);
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
        disabled={lobbyCode.error !== null || buyInAmount.error !== null}
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

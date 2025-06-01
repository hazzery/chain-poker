import { Box, Button } from "@mui/material";
import type { JSX, ReactNode } from "preact/compat";
import useNumberValidation from "../hooks/useNumberValidation";
import useStringValidation from "../hooks/useStringValidation";
import { buyIn } from "../secretnetwork/chainPokerContract";
import type { SecretNetworkState } from "../secretnetwork/secretNetworkState";
import TextInput from "./TextInput";

interface JoinLobbyProps {
  backAction: () => void;
  networkState: SecretNetworkState;
}

function JoinLobby({ backAction, networkState }: JoinLobbyProps): ReactNode {
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

    await buyIn(BigInt(buyInAmount.value), lobbyCode.value, networkState)
      .onSuccess(console.log)
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

import { Box, Button, TextField } from "@mui/material";
import { useState, type JSX, type ReactNode } from "preact/compat";
import TextInput from "./TextInput";
import useNumberValidation from "../hooks/useNumberValidation";
import type { SecretNetworkState } from "../secretnetwork/secretNetworkState";
import { buyIn } from "../secretnetwork/chainPokerContract";

interface JoinLobbyProps {
  backAction: () => void;
  networkState: SecretNetworkState;
}

function JoinLobby({ backAction, networkState }: JoinLobbyProps): ReactNode {
  const [lobbyCode, setLobbyCode] = useState<string>("");
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
      <TextField
        value={lobbyCode}
        onChange={(event) => setLobbyCode(event.target.value)}
        variant="outlined"
        label={"Lobby code"}
      ></TextField>
      <TextInput
        state={buyInAmount}
        setState={setBuyInAmount}
        label="Buy in amount (SCRT)"
        variant="outlined"
      />
      <Button
        type="submit"
        disabled={lobbyCode === "" || buyInAmount.error !== null}
        variant="outlined"
        color="success"
      >
        Join
      </Button>
      <Button
        variant="outlined"
        color="inherit"
        onClick={backAction}
        sx={{ width: "6em" }}
      >
        Back
      </Button>
    </Box>
  );
}

export default JoinLobby;

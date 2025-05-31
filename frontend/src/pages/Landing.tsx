import { Box, Button, TextField, Typography } from "@mui/material";
import type { ReactNode } from "preact/compat";
import { useState } from "preact/hooks";
import { GiPokerHand } from "react-icons/gi";

import NavBar from "../components/NavBar";
import type { SecretNetworkState } from "../secretnetwork/secretNetworkState";
import initialseNetworkClient from "../secretnetwork/keplrWallet";
import { Result } from "typescript-result";
import { createLobby } from "../secretnetwork/chainPokerContract";
import CreateLobby from "../components/CreateLobby";

const enum LandingMode {
  ConnectWallet,
  Main,
  Create,
  Join,
}

function Landing() {
  const [mode, setMode] = useState(LandingMode.ConnectWallet);
  const [networkState, setNetworkState] = useState<SecretNetworkState | null>(
    null,
  );

  function goBack(): void {
    setMode(LandingMode.Main);
  }

  async function connectWallet(): Promise<void> {
    if (window.keplr === undefined) {
      alert(
        "Keplr Wallet is not installed. Please install the Keplr Wallet browser extension to use Chain Poker",
      );
      return;
    }

    Result.fromAsync(initialseNetworkClient(window.keplr))
      .onSuccess(setNetworkState)
      .onSuccess(() => setMode(LandingMode.Main));
  }

  function showContent(): ReactNode {
    switch (mode) {
      case LandingMode.ConnectWallet:
        return (
          <>
            <Button variant="outlined" color="success" onClick={connectWallet}>
              Connect Wallet
            </Button>
          </>
        );

      case LandingMode.Main:
        return (
          <>
            <Button
              variant="outlined"
              color="success"
              onClick={() => setMode(LandingMode.Create)}
            >
              Create lobby
            </Button>
            <Button
              variant="outlined"
              color="success"
              onClick={() => setMode(LandingMode.Join)}
            >
              Join existing loby
            </Button>
          </>
        );

      case LandingMode.Create:
        return <CreateLobby backAction={goBack} networkState={networkState} />;

      case LandingMode.Join:
        return (
          <>
            <Box display="flex" columnGap="1em">
              <TextField
                variant="outlined"
                label={"Enter contract address"}
              ></TextField>
              <Button variant="outlined" color="success">
                Join
              </Button>
            </Box>
            <Button
              variant="outlined"
              color="inherit"
              onClick={goBack}
              sx={{ width: "6em" }}
            >
              Back
            </Button>
          </>
        );
    }
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <NavBar />
      <Box display="flex" alignItems="center" marginTop="5em">
        <GiPokerHand size="20em" />
        <Typography fontSize="5em">Chain Poker</Typography>
      </Box>
      <Box
        sx={{
          padding: "2em",
          display: "flex",
          flexDirection: "column",
          columnGap: "1em",
          rowGap: "1em",
        }}
      >
        {showContent()}
      </Box>
    </Box>
  );
}

export default Landing;

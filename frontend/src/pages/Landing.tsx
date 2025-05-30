import { Box, Button, TextField, Typography } from "@mui/material";
import type { ReactNode } from "preact/compat";
import { useState } from "preact/hooks";
import { GiPokerHand } from "react-icons/gi";

import NavBar from "../components/NavBar";

const enum LandingMode {
  ConnectWallet,
  Main,
  Create,
  Join,
}

function Landing() {
  const [mode, setMode] = useState(LandingMode.ConnectWallet);

  function goBack(): void {
    setMode(LandingMode.Main);
  }

  function showContent(): ReactNode {
    switch (mode) {
      case LandingMode.ConnectWallet:
        return (
          <>
            <Button onClick={connectWallet}>Connect Wallet</Button>
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
        return (
          <>
            <Box display="flex" columnGap="1em">
              <TextField
                variant="outlined"
                label={"Enter contract code ID"}
              ></TextField>
              <Button variant="outlined" color="success">
                Create
              </Button>
            </Box>
            <Button
              variant="outlined"
              color="inherit"
              sx={{ width: "6em" }}
              onClick={goBack}
            >
              Back
            </Button>
          </>
        );
      case LandingMode.Join:
        return (
          <>
            <Box display="flex" columnGap="1em">
              <TextField variant="outlined" label={"Enter contract address"}>
                Hello
              </TextField>
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

import type { Window as KeplrWindow } from "@keplr-wallet/types";
import { Button } from "@mui/material";
import type { VNode } from "preact";
import { useState } from "preact/hooks";
import { Result } from "typescript-result";

import ChainPoker from "../components/ChainPoker";
import CreateLobby from "../components/CreateLobby";
import JoinLobby from "../components/JoinLobby";
import { useNetworkContext } from "../secretnetwork/SecretNetworkContext";
import initialseNetworkClient from "../secretnetwork/keplrWallet";

declare global {
  interface Window extends KeplrWindow {}
}

const enum LandingMode {
  ConnectWallet,
  Main,
  Create,
  Join,
}

function Landing(): VNode {
  const networkContext = useNetworkContext();
  const [mode, setMode] = useState(
    networkContext.networkClient === null
      ? LandingMode.ConnectWallet
      : LandingMode.Main,
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
      .onSuccess(networkContext.setNetworkClient)
      .onSuccess(() => setMode(LandingMode.Main));
  }

  function showContent(): VNode | undefined {
    switch (mode) {
      case LandingMode.ConnectWallet:
        return <Button onClick={connectWallet}>Connect Wallet</Button>;

      case LandingMode.Main:
        return (
          <>
            <Button onClick={() => setMode(LandingMode.Create)}>
              Create lobby
            </Button>
            <Button onClick={() => setMode(LandingMode.Join)}>
              Join existing loby
            </Button>
          </>
        );

      case LandingMode.Create:
        if (networkContext.networkClient === null) {
          setMode(LandingMode.ConnectWallet);
          return;
        }
        return (
          <CreateLobby
            backAction={goBack}
            networkClient={networkContext.networkClient}
          />
        );

      case LandingMode.Join:
        if (networkContext.networkClient === null) {
          setMode(LandingMode.ConnectWallet);
          return;
        }
        return (
          <JoinLobby
            backAction={goBack}
            networkClient={networkContext.networkClient}
          />
        );
    }
  }

  return <ChainPoker>{showContent()}</ChainPoker>;
}

export default Landing;

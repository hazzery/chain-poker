import type { Window as KeplrWindow } from "@keplr-wallet/types";
import { Button, Card } from "@mui/material";
import { useState, type ReactNode } from "preact/compat";
import { Result } from "typescript-result";

import { buyIn } from "../secretnetwork/chainPokerContract";
import initialseNetworkClient from "../secretnetwork/keplrWallet";
import { type SecretNetworkState } from "../secretnetwork/secretNetworkState";

declare global {
  interface Window extends KeplrWindow {}
}

function ConnectWallet(): ReactNode {
  const [secretNetworkState, setSecretNetworkState] =
    useState<SecretNetworkState | null>(null);

  async function connectKeplr(): Promise<void> {
    if (window.keplr === undefined) {
      alert(
        "Keplr Wallet is not installed. Please install the Keplr Wallet browser extension to use Chain Poker",
      );
      return;
    }

    setSecretNetworkState(await initialseNetworkClient(window.keplr));
  }

  return (
    <Card sx={{ padding: "3em" }}>
      <Button onClick={connectKeplr}>Connect Wallet</Button>
      {secretNetworkState && (
        <Button
          onClick={() =>
            Result.fromAsync(buyIn(BigInt(1_000_000), secretNetworkState))
              .onFailure(alert)
              .onSuccess(console.dir)
          }
        >
          Buy in
        </Button>
      )}
    </Card>
  );
}

export default ConnectWallet;

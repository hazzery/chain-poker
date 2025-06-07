import { Button } from "@mui/material";
import type { VNode } from "preact";
import { useLocation, useRoute } from "preact-iso";
import { Result } from "typescript-result";

import ChainPoker from "../components/ChainPoker";
import initialseNetworkClient from "../secretnetwork/keplrWallet";
import { useNetworkClient } from "../secretnetwork/SecretNetworkContext";

function Reconnect(): VNode | undefined {
  const location = useLocation();
  const { lobbyCode } = useRoute().params;
  const networkContext = useNetworkClient();

  // TODO: Check that the player is actually part of the game once their wallet
  // is connected.

  async function connectWallet(): Promise<void> {
    if (window.keplr === undefined) {
      alert(
        "Keplr Wallet is not installed. Please install the Keplr Wallet browser extension to use Chain Poker",
      );
      return;
    }

    Result.fromAsync(initialseNetworkClient(window.keplr))
      .onSuccess(networkContext.setNetworkClient)
      .onSuccess(() => location.route(`/play/${lobbyCode}`));
  }

  return (
    <ChainPoker>
      <Button variant="outlined" color="success" onClick={connectWallet}>
        Connect Wallet
      </Button>
    </ChainPoker>
  );
}

export default Reconnect;

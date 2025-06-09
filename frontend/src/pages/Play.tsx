import { CircularProgress, Typography } from "@mui/material";
import type { VNode } from "preact";
import { useRoute } from "preact-iso";
import { useEffect, useState } from "preact/hooks";
import { Result } from "typescript-result";

import ChainPoker from "../components/ChainPoker";
import Game from "../components/Game";
import { viewGameState } from "../secretnetwork/chainPokerContract";
import { useNetworkClient } from "../secretnetwork/SecretNetworkContext";
import type { GameState } from "../secretnetwork/types";

function Play(): VNode {
  const networkClient = useNetworkClient();
  if (networkClient === undefined) {
    return (
      <ChainPoker>
        <CircularProgress color="success" />
      </ChainPoker>
    );
  } else if (networkClient === null) {
    return (
      <ChainPoker>
        <Typography>
          Keplr Wallet is not installed. Please install the Keplr Wallet browser
          extension to use Chain Poker
        </Typography>
      </ChainPoker>
    );
  }

  const { lobbyCode } = useRoute().params;
  const [gameState, setGameState] = useState<GameState>();

  useEffect(() => {
    const interval = setInterval(
      () =>
        Result.fromAsync(viewGameState(lobbyCode, networkClient))
          .onSuccess(setGameState)
          .onFailure(console.error),
      333,
    );
    return () => clearInterval(interval);
  }, [lobbyCode]);

  if (gameState === undefined) {
    return (
      <ChainPoker>
        <CircularProgress color="success" />
      </ChainPoker>
    );
  }

  return (
    <Game {...gameState} lobbyCode={lobbyCode} networkClient={networkClient} />
  );
}

export default Play;

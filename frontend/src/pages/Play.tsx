import type { VNode } from "preact";
import { useRoute } from "preact-iso";
import { useEffect, useState } from "preact/hooks";
import { Result } from "typescript-result";

import Game from "../components/Game";
import KeplrNotInstalled from "../components/KeplrNotInstalled";
import Loading from "../components/Loading";
import { viewGameStatus } from "../secretnetwork/chainPokerContract";
import { useNetworkClient } from "../secretnetwork/SecretNetworkContext";
import type { GameStatus } from "../secretnetwork/types";

function Play(): VNode {
  const networkClient = useNetworkClient();

  const { lobbyCode } = useRoute().params;
  const [gameStatus, setGameStatus] = useState<GameStatus>();

  useEffect(() => {
    document.title = "Play - Chain Poker";
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (networkClient === undefined || networkClient === null) return;

      Result.fromAsync(viewGameStatus(lobbyCode, networkClient))
        .onSuccess(console.log)
        .onSuccess(setGameStatus)
        .onFailure(console.error);
    }, 1000);
    return () => clearInterval(interval);
  }, [lobbyCode, networkClient]);

  if (networkClient === null) return <KeplrNotInstalled />;

  if (gameStatus === undefined || networkClient === undefined)
    return <Loading />;

  return (
    <Game {...gameStatus} lobbyCode={lobbyCode} networkClient={networkClient} />
  );
}

export default Play;

import { Box } from "@mui/material";
import type { VNode } from "preact";
import { useLocation, useRoute } from "preact-iso";
import { useEffect, useState } from "preact/hooks";
import { Result } from "typescript-result";

import CardSet from "../components/CardSet";
import { ChipCount } from "../components/ChipCount";
import FanLayout from "../components/FanLayout";
import { Hand } from "../components/Hand";
import type { PlayingCardProps } from "../components/PlayingCard";
import { viewHand, viewPlayers } from "../secretnetwork/chainPokerContract";
import { useNetworkClient } from "../secretnetwork/SecretNetworkContext";
import type { PlayerInfo } from "../secretnetwork/types";

function Game(): VNode | undefined {
  const location = useLocation();
  const networkClient = useNetworkClient().networkClient;
  if (networkClient === null) {
    location.route("/");
    return;
  }
  const { lobbyCode } = useRoute().params;
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [hand, setHand] = useState<[PlayingCardProps, PlayingCardProps] | []>(
    [],
  );
  const [table, setTable] = useState<PlayingCardProps[]>([]);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (players.length > 0) return;

    Result.fromAsync(viewPlayers(lobbyCode, networkClient))
      .onSuccess((players) =>
        setPlayers(
          players.map(([name, chipBalance]) => ({ name, chipBalance })),
        ),
      )
      .onFailure(console.error);
  }, [lobbyCode]);

  useEffect(() => {
    if (!gameStarted) return;

    Result.fromAsync(viewHand(lobbyCode, networkClient))
      .onSuccess((cards) => void 0)
      .onFailure(console.error);
  }, [lobbyCode]);

  const currentPot = 10;
  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <FanLayout players={players}>
        <CardSet cards={table} maxCards={5} />
        <ChipCount
          numberOfChips={currentPot}
          chipIconSize="3em"
          fontSize="2em"
          sx={{ justifyContent: "center", display: "flex" }}
        />
      </FanLayout>
      <Hand cards={hand} chipBalance={97.5} gameStarted={gameStarted} />
    </Box>
  );
}

export default Game;

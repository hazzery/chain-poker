import { Box } from "@mui/material";
import type { VNode } from "preact";
import { useState } from "preact/hooks";
import type { SecretNetworkClient } from "secretjs";

import type { GameState, PlayerInfo } from "../secretnetwork/types";
import CardSet from "./CardSet";
import { ChipCount } from "./ChipCount";
import FanLayout from "./FanLayout";
import Hand from "./Hand";

interface GameProps extends GameState {
  networkClient: SecretNetworkClient;
}

function Game({
  balances,
  table,
  pot,
  hand,
  current_turn,
  big_blind,
  networkClient,
}: GameProps): VNode | undefined {
  const [playerInfos] = useState<PlayerInfo[]>(
    balances.map(([name, chipBalance]) => ({ name, chipBalance })),
  );
  const [chipBalance] = useState(
    balances.find(([address]) => address === networkClient.address)![1],
  );

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <FanLayout players={playerInfos}>
        <CardSet cards={table} maxCards={5} />
        <ChipCount
          numberOfChips={pot}
          chipIconSize="3em"
          fontSize="2em"
          sx={{ justifyContent: "center", display: "flex" }}
        />
      </FanLayout>
      <Hand
        cards={hand}
        chipBalance={chipBalance}
        ourTurn={current_turn === networkClient.address}
      />
    </Box>
  );
}

export default Game;

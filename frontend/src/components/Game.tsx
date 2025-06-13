import { Box } from "@mui/material";
import type { VNode } from "preact";
import { useState } from "preact/hooks";
import type { SecretNetworkClient } from "secretjs";
import { Result } from "typescript-result";

import { placeBet } from "../secretnetwork/chainPokerContract";
import type { GameState, PlayerInfo } from "../secretnetwork/types";
import CardSet from "./CardSet";
import { ChipCount } from "./ChipCount";
import FanLayout from "./FanLayout";
import Hand from "./Hand";

interface GameProps extends GameState {
  lobbyCode: string;
  networkClient: SecretNetworkClient;
}

function Game({
  balances,
  table,
  pot,
  hand,
  current_turn,
  button_player,
  networkClient,
  lobbyCode,
}: GameProps): VNode | undefined {
  const playersUsername = localStorage.getItem("username");
  const [playerInfos] = useState<PlayerInfo[]>(
    balances.map(([name, chipBalance]) => ({ name, chipBalance })),
  );
  const [chipBalance] = useState(
    balances.find(([username]) => username === playersUsername)![1],
  );

  async function sendBet(betAmount: number): Promise<void> {
    await Result.fromAsync(
      placeBet(betAmount, lobbyCode, networkClient),
    ).onFailure(console.error);
  }

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <FanLayout
        players={playerInfos}
        currentTurn={current_turn}
        buttonPlayer={button_player}
      >
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
        ourTurn={current_turn === playersUsername}
        onBet={sendBet}
      />
    </Box>
  );
}

export default Game;

import { Box, Button } from "@mui/material";
import type { VNode } from "preact";
import { useLocation } from "preact-iso";
import type { SecretNetworkClient } from "secretjs";
import { Result } from "typescript-result";

import { placeBet, withdraw } from "../secretnetwork/chainPokerContract";
import type { GameState } from "../secretnetwork/types";
import { uScrtToScrt } from "../secretnetwork/utils";
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
  min_bet,
}: GameProps): VNode | undefined {
  const location = useLocation();

  const playersUsername = localStorage.getItem("username");
  const playerInfos = balances.map(([name, chipBalance]) => ({
    name,
    chipBalance: uScrtToScrt(BigInt(chipBalance)),
  }));
  const chipBalance = balances.find(
    ([username]) => username === playersUsername,
  )![1];

  function sendBet(betAmount: bigint): void {
    Result.fromAsync(placeBet(betAmount, lobbyCode, networkClient)).onFailure(
      console.error,
    );
  }

  function cashOut(): void {
    Result.fromAsync(withdraw(lobbyCode, networkClient))
      .onSuccess(() => location.route("/"))
      .onFailure(console.error);
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
          numberOfChips={uScrtToScrt(BigInt(pot))}
          chipIconSize="3em"
          fontSize="2em"
          sx={{ justifyContent: "center", display: "flex" }}
        />
      </FanLayout>
      <Button
        onClick={cashOut}
        variant="outlined"
        color="success"
        sx={{ width: "18em", marginLeft: "1em" }}
      >
        Cash out
      </Button>
      <Hand
        cards={hand}
        chipBalance={BigInt(chipBalance)}
        minBet={BigInt(min_bet)}
        ourTurn={current_turn === playersUsername}
        onBet={sendBet}
      />
    </Box>
  );
}

export default Game;

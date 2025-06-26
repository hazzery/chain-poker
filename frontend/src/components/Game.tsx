import { Box, Button } from "@mui/material";
import type { VNode } from "preact";
import { useLocation } from "preact-iso";
import type { SecretNetworkClient } from "secretjs";
import { Result } from "typescript-result";

import useScrtValidation from "../hooks/useScrtValidation";
import {
  call,
  check,
  fold,
  raise,
  withdraw,
} from "../secretnetwork/chainPokerContract";
import type { GameStatus } from "../secretnetwork/types";
import { uScrtToScrt } from "../secretnetwork/utils";
import CardSet from "./CardSet";
import { ChipCount } from "./ChipCount";
import FanLayout from "./FanLayout";
import Hand from "./Hand";
import ScrtInput from "./ScrtInput";

interface GameProps extends GameStatus {
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
  const minBet = BigInt(min_bet);

  const playerInfos = balances.map(([name, chipBalance]) => ({
    name,
    chipBalance: uScrtToScrt(BigInt(chipBalance)),
  }));
  const playersUsername = localStorage.getItem("username");
  const chipBalance = BigInt(
    balances.find(([username]) => username === playersUsername)![1],
  );

  const [raiseAmount, setRaiseAmount] = useScrtValidation({
    minValueUscrt: minBet,
    maxValueUscrt: chipBalance,
    allowZero: true,
  });

  function handleRaise(): void {
    Result.fromAsync(
      raise(raiseAmount.uScrt!, lobbyCode, networkClient),
    ).onFailure(console.error);
  }

  function handleCheck(): void {
    Result.fromAsync(check(lobbyCode, networkClient)).onFailure(console.error);
  }

  function handleFold(): void {
    Result.fromAsync(fold(lobbyCode, networkClient)).onFailure(console.error);
  }

  function handleCall(): void {
    Result.fromAsync(call(lobbyCode, networkClient)).onFailure(console.error);
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
      <Button onClick={cashOut} sx={{ width: "18em", marginLeft: "1em" }}>
        Cash out
      </Button>
      <Hand cards={hand} chipBalance={chipBalance}>
        {current_turn === playersUsername && (
          <Box
            sx={{ position: "fixed", right: "2em" }}
            display="flex"
            columnGap="1em"
            justifyContent="center"
          >
            {minBet > 0n && <Button onClick={handleFold}>Fold</Button>}
            {minBet === 0n && <Button onClick={handleCheck}>Check</Button>}
            {minBet > 0n && chipBalance >= minBet && (
              <Button onClick={handleCall}>Call</Button>
            )}
            {chipBalance > minBet && (
              <>
                <ScrtInput state={raiseAmount} setState={setRaiseAmount} />
                <Button
                  onClick={handleRaise}
                  disabled={raiseAmount.error !== null}
                >
                  Raise
                </Button>
              </>
            )}
          </Box>
        )}
      </Hand>
    </Box>
  );
}

export default Game;

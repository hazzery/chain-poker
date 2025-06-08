import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import type { VNode } from "preact";
import { useLocation, useRoute } from "preact-iso";
import { useEffect, useMemo, useState } from "preact/hooks";
import { Result } from "typescript-result";

import ChainPoker from "../components/ChainPoker";
import {
  startGame,
  viewPreStartState,
} from "../secretnetwork/chainPokerContract";
import { useNetworkClient } from "../secretnetwork/SecretNetworkContext";
import type { PlayerInfo, PreStartState } from "../secretnetwork/types";
import BuyIn from "./BuyIn";
import Player from "../components/Player";

function Lobby(): VNode | undefined {
  const networkClient = useNetworkClient();
  if (networkClient === undefined) {
    console.log("Waiting for networkClient");
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
  const [preStartState, setPreStartState] = useState<PreStartState>();
  useEffect(() => {
    if (preStartState !== undefined) return;
    console.log("Querying PreStartState");

    async function queryPrestartState() {
      await Result.fromAsync(viewPreStartState(lobbyCode, networkClient!))
        .onSuccess(setPreStartState)
        .onFailure(console.error);
    }

    queryPrestartState();
  }, [lobbyCode]);
  if (preStartState === undefined) {
    console.log("Waiting for preStartState");
    return (
      <ChainPoker>
        <CircularProgress color="success" />
      </ChainPoker>
    );
  }

  const location = useLocation();
  async function start() {
    await Result.fromAsync(startGame(lobbyCode, networkClient!))
      .onSuccess(() => location.route(`/play/${lobbyCode}`))
      .onFailure(console.error);
  }

  const data = useMemo(() => {
    const playerInfos: PlayerInfo[] = preStartState.balances.map(
      ([name, chipBalance]) => ({ name, chipBalance }),
    );

    const chipBalance = preStartState.balances.find(
      ([address]) => address === networkClient.address,
    )?.[1];

    const minBuyIn =
      preStartState.lobby_config.big_blind *
      preStartState.lobby_config.min_buy_in_bb;
    const maxBuyIn =
      preStartState.lobby_config.big_blind *
      preStartState.lobby_config.max_buy_in_bb;

    const isAdmin = preStartState.admin === networkClient.address;

    return { playerInfos, chipBalance, minBuyIn, maxBuyIn, isAdmin };
  }, [preStartState]);

  function showPlayers(): VNode[] {
    return data.playerInfos.map((player) => <Player {...player} />);
  }

  return (
    <ChainPoker>
      <Box>
        <Typography>Lobby code: {lobbyCode}</Typography>
        <Typography>Lobby admin: {preStartState.admin}</Typography>
        <Typography>Minimum buy in {data.minBuyIn} SCRT</Typography>
        <Typography>Maximum buy in {data.maxBuyIn} SCRT</Typography>
        {data.chipBalance !== undefined && (
          <Typography>Your balance: {data.chipBalance}</Typography>
        )}
      </Box>
      {data.playerInfos.length === 0 ? (
        <Typography>There are currently no bought in players</Typography>
      ) : (
        showPlayers()
      )}
      {data.chipBalance === undefined && (
        <>
          <Divider />
          <Typography>Buy In:</Typography>
          <BuyIn
            lobbyCode={lobbyCode}
            minBuyIn={data.minBuyIn}
            maxBuyIn={data.maxBuyIn}
            networkClient={networkClient}
            onBuyIn={() => setPreStartState(undefined)}
          />
        </>
      )}
      {data.isAdmin && (
        <>
          <Divider />
          <Button
            disabled={data.playerInfos.length < 2}
            onClick={start}
            variant="outlined"
            color="success"
          >
            Start Game
          </Button>
        </>
      )}
    </ChainPoker>
  );
}

export default Lobby;

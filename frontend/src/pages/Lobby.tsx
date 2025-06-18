import { Box, Button, Divider, Typography } from "@mui/material";
import type { VNode } from "preact";
import { useLocation, useRoute } from "preact-iso";
import { useEffect, useMemo, useState } from "preact/hooks";
import { Result } from "typescript-result";

import BuyIn from "../components/BuyIn";
import ChainPoker from "../components/ChainPoker";
import KeplrNotInstalled from "../components/KeplrNotInstalled";
import Loading from "../components/Loading";
import Player from "../components/Player";
import {
  startGame,
  viewPreStartState,
} from "../secretnetwork/chainPokerContract";
import { useNetworkClient } from "../secretnetwork/SecretNetworkContext";
import type { PlayerInfo, PreStartState } from "../secretnetwork/types";

function Lobby(): VNode | undefined {
  const networkClient = useNetworkClient();
  const { lobbyCode } = useRoute().params;
  const location = useLocation();
  const [preStartState, setPreStartState] = useState<PreStartState>();
  const [shouldRerequest, setShouldRerequest] = useState(false);

  useEffect(() => {
    if (networkClient === undefined || networkClient === null) {
      return;
    }

    Result.fromAsync(viewPreStartState(lobbyCode, networkClient))
      .onSuccess(setPreStartState)
      .onFailure(console.error);
  }, [lobbyCode, networkClient, shouldRerequest]);

  useEffect(() => {
    const interval = setInterval(() => {
      setShouldRerequest((previous) => !previous);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const data = useMemo(() => {
    if (preStartState === undefined) return;

    const playersUsername = localStorage.getItem("username");

    const playerInfos: PlayerInfo[] = preStartState.balances.map(
      ([name, chipBalance]) => ({ name, chipBalance }),
    );

    const chipBalance = preStartState.balances.find(
      ([username]) => username === playersUsername,
    )?.[1];

    const minBuyIn =
      BigInt(preStartState.lobby_config.big_blind) *
      BigInt(preStartState.lobby_config.min_buy_in_bb);
    const maxBuyIn =
      BigInt(preStartState.lobby_config.big_blind) *
      BigInt(preStartState.lobby_config.max_buy_in_bb);

    const isAdmin = preStartState.admin === playersUsername;

    return { playerInfos, chipBalance, minBuyIn, maxBuyIn, isAdmin };
  }, [preStartState]);

  if (networkClient === null) return <KeplrNotInstalled />;

  if (
    preStartState === undefined ||
    data === undefined ||
    networkClient === undefined
  )
    return <Loading />;

  if (preStartState.is_started) {
    location.route(`/play/${lobbyCode}`);
    return;
  }

  function start(): void {
    Result.fromAsync(startGame(lobbyCode, networkClient!))
      .onSuccess(() => location.route(`/play/${lobbyCode}`))
      .onFailure(console.error);
  }

  function reconnect(): void {
    location.route(`/play/${lobbyCode}`);
  }

  return (
    <ChainPoker>
      <Box>
        <Typography>Lobby code: {lobbyCode}</Typography>
        <Typography>Lobby admin: {preStartState.admin}</Typography>
        <Typography>
          Big blind amount: {preStartState.lobby_config.big_blind}
        </Typography>
        <Typography>Minimum buy in {data.minBuyIn} SCRT</Typography>
        <Typography>Maximum buy in {data.maxBuyIn} SCRT</Typography>
        {data.chipBalance !== undefined && (
          <Typography>Your balance: {data.chipBalance}</Typography>
        )}
        {preStartState.is_started && (
          <Typography>This game is in session</Typography>
        )}
      </Box>
      {data.playerInfos.length > 0 ? (
        data.playerInfos.map(Player)
      ) : (
        <Typography>There are currently no bought in players</Typography>
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
            onBuyIn={() => {
              setPreStartState(undefined);
              setShouldRerequest(!shouldRerequest);
            }}
          />
        </>
      )}
      {data.isAdmin && !preStartState.is_started && (
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
      {preStartState.is_started && data.chipBalance !== undefined && (
        <>
          <Divider />
          <Button onClick={reconnect} variant="outlined" color="success">
            Reconnect
          </Button>
        </>
      )}
    </ChainPoker>
  );
}

export default Lobby;

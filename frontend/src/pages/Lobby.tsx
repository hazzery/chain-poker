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
import { uScrtToScrt } from "../secretnetwork/utils";

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
      ([name, chipBalance]) => ({
        name,
        chipBalance: uScrtToScrt(BigInt(chipBalance)),
      }),
    );

    const chipBalance = playerInfos.find(
      ({ name }) => name === playersUsername,
    )?.chipBalance;

    const bigBlindBigInt = BigInt(preStartState.lobby_config.big_blind);

    const minBuyIn =
      bigBlindBigInt * BigInt(preStartState.lobby_config.min_buy_in_bb);
    const maxBuyIn =
      bigBlindBigInt * BigInt(preStartState.lobby_config.max_buy_in_bb);

    const isAdmin = preStartState.admin === playersUsername;

    return {
      playerInfos,
      chipBalance,
      minBuyIn,
      maxBuyIn,
      isAdmin,
      bigBlindBigInt,
    };
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
          Big blind amount: {uScrtToScrt(data.bigBlindBigInt)}
        </Typography>
        <Typography>
          Minimum buy in {uScrtToScrt(data.minBuyIn)} SCRT
        </Typography>
        <Typography>
          Maximum buy in {uScrtToScrt(data.maxBuyIn)} SCRT
        </Typography>
        {data.chipBalance !== undefined && (
          <Typography>Your balance: {data.chipBalance} SCRT</Typography>
        )}
        {preStartState.is_started && (
          <Typography>This game is in session</Typography>
        )}
        {preStartState.balances.length >= 9 && (
          <Typography>This lobby is full</Typography>
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
            currentNumPlayers={preStartState.balances.length}
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

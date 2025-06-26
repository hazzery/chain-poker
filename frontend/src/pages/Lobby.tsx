import { Button, Paper, Stack, Typography } from "@mui/material";
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
import InfoRow from "../components/InfoRow";

function Lobby(): VNode | undefined {
  const networkClient = useNetworkClient();
  const { lobbyCode } = useRoute().params;
  const location = useLocation();
  const [preStartState, setPreStartState] = useState<PreStartState>();
  const [shouldRerequest, setShouldRerequest] = useState(false);

  useEffect(() => {
    if (!networkClient) return;
    Result.fromAsync(viewPreStartState(lobbyCode, networkClient))
      .onSuccess(setPreStartState)
      .onFailure(console.error);
  }, [lobbyCode, networkClient, shouldRerequest]);

  useEffect(() => {
    const interval = setInterval(
      () => setShouldRerequest((previous) => !previous),
      2000,
    );
    return () => clearInterval(interval);
  }, []);

  const data = useMemo(() => {
    if (!preStartState) return;
    const username = localStorage.getItem("username");
    const players: PlayerInfo[] = preStartState.balances.map(
      ([name, chipBalance]) => ({
        name,
        chipBalance: uScrtToScrt(BigInt(chipBalance)),
      }),
    );
    const myBalance = players.find((p) => p.name === username)?.chipBalance;
    const bigBlind = BigInt(preStartState.lobby_config.big_blind);
    const minBuyIn =
      bigBlind * BigInt(preStartState.lobby_config.min_buy_in_bb);
    const maxBuyIn =
      bigBlind * BigInt(preStartState.lobby_config.max_buy_in_bb);
    const isAdmin = preStartState.admin === username;
    return { players, myBalance, bigBlind, minBuyIn, maxBuyIn, isAdmin };
  }, [preStartState]);

  if (networkClient === null) return <KeplrNotInstalled />;

  if (!networkClient || !preStartState || !data) return <Loading />;

  if (preStartState.is_started) {
    location.route(`/play/${lobbyCode}`);
    return;
  }

  function handleStart() {
    Result.fromAsync(startGame(lobbyCode, networkClient!))
      .onSuccess(() => location.route(`/play/${lobbyCode}`))
      .onFailure(console.error);
  }
  function handleReconnect() {
    location.route(`/play/${lobbyCode}`);
  }

  return (
    <ChainPoker>
      <Stack spacing={3} sx={{ width: "100%", maxWidth: 600, mx: "auto" }}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Lobby Details
          </Typography>
          <Stack spacing={1}>
            <InfoRow label="Code" value={lobbyCode} />
            <InfoRow label="Admin" value={preStartState.admin} />
            <InfoRow
              label="Big Blind"
              value={`${uScrtToScrt(data.bigBlind)} SCRT`}
            />
            <InfoRow
              label="Min Buy-In"
              value={`${uScrtToScrt(data.minBuyIn)} SCRT`}
            />
            <InfoRow
              label="Max Buy-In"
              value={`${uScrtToScrt(data.maxBuyIn)} SCRT`}
            />
            {data.myBalance !== undefined && (
              <InfoRow label="Your Balance" value={`${data.myBalance} SCRT`} />
            )}
            {preStartState.is_started && (
              <Typography color="warning.main">Game in session</Typography>
            )}
            {preStartState.balances.length >= 9 && (
              <Typography color="error.main">Lobby is full</Typography>
            )}
          </Stack>
        </Paper>

        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Players ({data.players.length})
          </Typography>
          <Stack spacing={1}>
            {data.players.length > 0 ? (
              data.players.map((p) => <Player {...p} key={p.name} />)
            ) : (
              <Typography color="text.secondary">
                No one has bought in yet
              </Typography>
            )}
          </Stack>
        </Paper>

        <Paper elevation={1} sx={{ p: 2 }}>
          <Stack spacing={2}>
            {data.myBalance === undefined && (
              <>
                <Typography variant="subtitle2">Buy In</Typography>
                <BuyIn
                  lobbyCode={lobbyCode}
                  minBuyIn={data.minBuyIn}
                  maxBuyIn={data.maxBuyIn}
                  currentNumPlayers={preStartState.balances.length}
                  networkClient={networkClient}
                  onBuyIn={() => {
                    setPreStartState(undefined);
                    setShouldRerequest((b) => !b);
                  }}
                />
              </>
            )}

            {data.isAdmin && !preStartState.is_started && (
              <Button
                variant="contained"
                color="success"
                disabled={data.players.length < 2}
                onClick={handleStart}
              >
                Start Game
              </Button>
            )}

            {preStartState.is_started && data.myBalance !== undefined && (
              <Button
                variant="outlined"
                color="primary"
                onClick={handleReconnect}
              >
                Reconnect
              </Button>
            )}
          </Stack>
        </Paper>
      </Stack>
    </ChainPoker>
  );
}

export default Lobby;

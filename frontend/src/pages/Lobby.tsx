import { Button, Paper, Stack, Typography } from "@mui/material";
import type { VNode } from "preact";
import { useLocation, useRoute } from "preact-iso";
import { useEffect, useMemo, useState } from "preact/hooks";
import { MdContentCopy } from "react-icons/md";
import { Result } from "typescript-result";

import BuyIn from "../components/BuyIn";
import ChainPoker from "../components/ChainPoker";
import KeplrNotInstalled from "../components/KeplrNotInstalled";
import Loading from "../components/Loading";
import Player from "../components/Player";

import InfoRow from "../components/InfoRow";
import {
  startGame,
  viewLobbyStatus,
} from "../secretnetwork/chainPokerContract";
import { useNetworkClient } from "../secretnetwork/SecretNetworkContext";
import type { PlayerInfo, LobbyStatus } from "../secretnetwork/types";
import { uScrtToScrt } from "../secretnetwork/utils";

function Lobby(): VNode | undefined {
  const networkClient = useNetworkClient();
  const { lobbyCode } = useRoute().params;
  const location = useLocation();
  const [lobbyStatus, setLobbyStatus] = useState<LobbyStatus>();
  const [shouldRerequest, setShouldRerequest] = useState(false);

  useEffect(() => {
    document.title = "View Lobby - Chain Poker";
  }, []);

  useEffect(() => {
    if (!networkClient) return;
    Result.fromAsync(viewLobbyStatus(lobbyCode, networkClient))
      .onSuccess(setLobbyStatus)
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
    if (!lobbyStatus) return;
    const username = localStorage.getItem("username");
    const players: PlayerInfo[] = lobbyStatus.balances.map(
      ([name, chipBalance]) => ({
        name,
        chipBalance: uScrtToScrt(BigInt(chipBalance)),
      }),
    );
    const myBalance = players.find((p) => p.name === username)?.chipBalance;
    const bigBlind = BigInt(lobbyStatus.lobby_config.big_blind);
    const minBuyIn = bigBlind * BigInt(lobbyStatus.lobby_config.min_buy_in_bb);
    const maxBuyIn = bigBlind * BigInt(lobbyStatus.lobby_config.max_buy_in_bb);
    const isAdmin = lobbyStatus.admin === username;
    return { players, myBalance, bigBlind, minBuyIn, maxBuyIn, isAdmin };
  }, [lobbyStatus]);

  if (networkClient === null) return <KeplrNotInstalled />;

  if (!networkClient || !lobbyStatus || !data) return <Loading />;

  if (lobbyStatus.is_started) {
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

  function copyCode() {
    navigator.clipboard.writeText(lobbyCode).catch(console.error);
  }
  const canStart = data.isAdmin && !lobbyStatus.is_started;
  const canReconnect = lobbyStatus.is_started && data.myBalance;

  return (
    <ChainPoker>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={3}
        sx={{
          width: "100%",
          minWidth: "25em",
          mx: "auto",
          alignItems: "stretch",
        }}
      >
        {/* LEFT COLUMN (details, buy-in form, start game, reconect) */}
        <Stack spacing={3} flex={1}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Lobby Details
            </Typography>

            <InfoRow
              label="Code"
              value={
                <Button
                  color="inherit"
                  variant="text"
                  onClick={copyCode}
                  endIcon={<MdContentCopy />}
                  style={{ textTransform: "none" }}
                >
                  {lobbyCode}
                </Button>
              }
            />

            <InfoRow label="Admin" value={lobbyStatus.admin} />
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
          </Paper>

          {data.myBalance === undefined && (
            <Paper elevation={1} sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Typography variant="subtitle1">Buy-In</Typography>
                <BuyIn
                  lobbyCode={lobbyCode}
                  minBuyIn={data.minBuyIn}
                  maxBuyIn={data.maxBuyIn}
                  currentNumPlayers={lobbyStatus.balances.length}
                  networkClient={networkClient}
                  onBuyIn={() => {
                    setLobbyStatus(undefined);
                    setShouldRerequest((previous) => !previous);
                  }}
                />
              </Stack>
            </Paper>
          )}

          {(canStart || canReconnect) && (
            <Paper sx={{ padding: "1em" }}>
              <Stack>
                {canStart && (
                  <Button
                    onClick={handleStart}
                    disabled={data.players.length < 2}
                  >
                    Start Game
                  </Button>
                )}

                {canReconnect && (
                  <Button onClick={handleReconnect}>Reconnect</Button>
                )}
              </Stack>
            </Paper>
          )}
        </Stack>

        {/* RIGHT COLUMN (players) */}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            width: { xs: "100%", lg: 300 },
            flexShrink: 0,
          }}
        >
          <Typography variant="subtitle1" gutterBottom>
            Players ({data.players.length})
          </Typography>
          <Stack spacing={1}>
            {data.players.length > 0 ? (
              data.players.map((player) => (
                <Player {...player} key={player.name} />
              ))
            ) : (
              <Typography color="text.secondary">
                No one has bought in yet
              </Typography>
            )}
          </Stack>
        </Paper>
      </Stack>
    </ChainPoker>
  );
}

export default Lobby;

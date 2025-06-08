import type { PlayingCardProps } from "../components/PlayingCard";

interface LobbyConfig {
  big_blind: number;
  max_buy_in_bb: number;
  min_buy_in_bb: number;
}

interface PlayerInfo {
  name: string;
  chipBalance: number;
}

interface GameState {
  balances: [string, number][];
  table: PlayingCardProps[];
  pot: number;
  hand: [PlayingCardProps, PlayingCardProps] | null;
  current_turn: string;
  big_blind: string;
}

interface PreStartState {
  admin: string;
  lobby_config: LobbyConfig;
  is_started: boolean;
  balances: [string, number][];
}

export type { LobbyConfig, PlayerInfo, GameState, PreStartState };

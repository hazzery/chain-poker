
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
  table: number[];
  pot: number;
  hand: [number, number] | null;
  current_turn: string;
  button_player: string;
}

interface PreStartState {
  admin: string;
  lobby_config: LobbyConfig;
  is_started: boolean;
  balances: [string, number][];
}

export type { GameState, LobbyConfig, PlayerInfo, PreStartState };

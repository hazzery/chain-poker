interface LobbyConfig {
  big_blind: string;
  max_buy_in_bb: number;
  min_buy_in_bb: number;
}

interface GameState {
  balances: [string, string][]; // [username, balance]
  table: number[]; // cards are 8 bit integers
  pot: string;
  hand: [number, number] | null;
  current_turn: string;
  button_player: string;
  min_bet: string;
}

interface PreStartState {
  admin: string;
  lobby_config: LobbyConfig;
  is_started: boolean;
  balances: [string, string][]; // [username, balance]
}

export type { GameState, LobbyConfig, PreStartState };

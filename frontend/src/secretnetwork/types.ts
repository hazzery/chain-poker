interface LobbyConfig {
  big_blind: number;
  max_buy_in_bb: number;
  min_buy_in_bb: number;
}

interface PlayerInfo {
  name: string;
  chipBalance: number;
}

export type { LobbyConfig, PlayerInfo };

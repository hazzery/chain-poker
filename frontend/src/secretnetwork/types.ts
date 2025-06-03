interface LobbyConfig {
  big_blind: string;
  max_buy_in_bb: string;
  min_buy_in_bb: string;
}

interface PlayerInfo {
  name: string;
  chipBalance: number;
}

export type { LobbyConfig, PlayerInfo };

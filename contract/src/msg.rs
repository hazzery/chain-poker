use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Uint128;
use secret_toolkit::permit::Permit;

use crate::state::LobbyConfig;

#[cw_serde]
pub struct InstantiateMsg {
    pub username: String,
    pub big_blind: u32,
    pub max_buy_in_bb: u8,
    pub min_buy_in_bb: u8,
}

#[cw_serde]
pub enum ExecuteMsg {
    StartGame {},
    BuyIn { username: String },
    Fold {},
    Check {},
    Call {},
    Raise { raise_amount: Uint128 },
    Withdraw {},
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(LobbyStatus)]
    ViewLobbyStatus {},

    #[returns(InGameStatus)]
    ViewGameStatus { permit: Permit },
}

#[cw_serde]
pub struct LobbyStatus {
    pub admin: String,
    pub lobby_config: LobbyConfig,
    pub is_started: bool,
    pub balances: Vec<(String, u128)>,
}

#[cw_serde]
pub struct InGameStatus {
    pub balances: Vec<(String, u128)>,
    pub table: Vec<u8>,
    pub pot: u128,
    pub hand: Option<(u8, u8)>,
    pub current_turn: String,
    pub button_player: String,
    pub min_bet: u128,
}

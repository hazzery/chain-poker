use cosmwasm_std::{
    coins, from_binary,
    testing::{mock_env, mock_info},
    Deps, DepsMut,
};

use crate::{
    contract::{execute, instantiate, query},
    msg::{ExecuteMsg, InGameStatus, InstantiateMsg, LobbyStatus, QueryMsg},
    state::LobbyConfig,
};

pub const VALID_USERNAME: &str = "TestUser";
pub const VALID_LOBBY_CONFIG: LobbyConfig = LobbyConfig {
    big_blind: 1_000_000,
    max_buy_in_bb: 100,
    min_buy_in_bb: 50,
};
pub const VALID_MAX_BUY_IN: u128 =
    VALID_LOBBY_CONFIG.big_blind as u128 * VALID_LOBBY_CONFIG.max_buy_in_bb as u128;
pub const VALID_MIN_BUY_IN: u128 =
    VALID_LOBBY_CONFIG.big_blind as u128 * VALID_LOBBY_CONFIG.min_buy_in_bb as u128;

pub fn valid_instantiation(deps: DepsMut) {
    let info = mock_info("creator", &[]);
    let msg = InstantiateMsg {
        username: VALID_USERNAME.to_string(),
        big_blind: VALID_LOBBY_CONFIG.big_blind,
        max_buy_in_bb: VALID_LOBBY_CONFIG.max_buy_in_bb,
        min_buy_in_bb: VALID_LOBBY_CONFIG.min_buy_in_bb,
    };

    instantiate(deps, mock_env(), info, msg).unwrap();
}

pub fn buy_in(sender: &str, amount: u128, deps: DepsMut) {
    let info = mock_info(sender, &coins(amount, "uscrt"));
    let msg = ExecuteMsg::BuyIn {
        username: sender.to_string(),
    };

    execute(deps, mock_env(), info, msg).unwrap();
}

pub fn start_game(deps: DepsMut) {
    let info = mock_info("creator", &[]);
    let msg = ExecuteMsg::StartGame {};

    execute(deps, mock_env(), info, msg).unwrap();
}

pub fn call(sender: &str, deps: DepsMut) {
    let info = mock_info(sender, &[]);
    let msg = ExecuteMsg::Call {};

    execute(deps, mock_env(), info, msg);
}

pub fn query_lobby_status(deps: Deps) -> LobbyStatus {
    let msg = QueryMsg::ViewLobbyStatus {};
    let query_response = query(deps, mock_env(), msg).unwrap();

    from_binary(&query_response).unwrap()
}

pub fn query_game_status(sender: &str, deps: Deps) -> InGameStatus {
    let permit = sender; // Either create of mock permit
    let msg = QueryMsg::ViewGameStatus { permit };
    let query_response = query(deps, mock_env(), msg).unwrap();

    from_binary(&query_response).unwrap()
}

pub fn find_balance(username: String, balances: &[(String, u128)]) {
    balances.iter().find_map(|(username_, balance)| {
        if username_ == username {
            Some(balance)
        } else {
            None
        }
    })
}

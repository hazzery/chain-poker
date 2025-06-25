use cosmwasm_std::{to_binary, Binary, CanonicalAddr, Deps, Env, StdError, StdResult};
use secret_toolkit::permit::Permit;

use crate::state::{
    game_state::GameState, get_balances, InGameStatus, LobbyStatus, ADMIN, ALL_PLAYERS, BETS,
    BUTTON_POSITION, CURRENT_MIN_BET, CURRENT_STATE, CURRENT_TURN_POSITION, HANDS, LOBBY_CONFIG,
    POT, TABLE, USERNAMES,
};

pub fn query_pre_start_state(deps: Deps) -> StdResult<Binary> {
    let players: Vec<CanonicalAddr> = ALL_PLAYERS.iter(deps.storage)?.flatten().collect();

    let pre_start_state = LobbyStatus {
        admin: USERNAMES
            .get(deps.storage, &ADMIN.load(deps.storage)?)
            .unwrap(),
        lobby_config: LOBBY_CONFIG.load(deps.storage)?,
        is_started: CURRENT_STATE.load(deps.storage)? != GameState::NotStarted,
        balances: get_balances(&players, deps),
    };

    to_binary(&pre_start_state)
}

pub fn query_game_state(deps: Deps, env: Env, permit: Permit) -> StdResult<Binary> {
    let current_game_state = CURRENT_STATE.load(deps.storage)?;
    if current_game_state == GameState::NotStarted {
        return Err(StdError::generic_err("The game has not yet started"));
    }

    let account = secret_toolkit::permit::validate(
        deps,
        "revoked_permits",
        &permit,
        env.contract.address.to_string(),
        None,
    )?;
    let sender = deps.api.addr_canonicalize(&account)?;

    if !USERNAMES.contains(deps.storage, &sender) {
        return Err(StdError::generic_err("You are not part of this game"));
    }

    let players: Vec<CanonicalAddr> = ALL_PLAYERS.iter(deps.storage)?.flatten().collect();
    let balances = get_balances(&players, deps);

    let current_turn_position = CURRENT_TURN_POSITION.load(deps.storage)? as usize;
    let current_turn = balances
        .get(current_turn_position)
        .ok_or(StdError::generic_err(format!(
            "CURRENT_TURN_POSITION ({current_turn_position}) out of range for balances (length {})",
            balances.len()
        )))?
        .0
        .clone();

    let button_player_position = BUTTON_POSITION.load(deps.storage)? as usize;
    let button_player = balances
        .get(button_player_position)
        .ok_or(StdError::generic_err(format!(
            "BUTTON_POSITION ({button_player_position}) out of range for balances (length {})",
            balances.len()
        )))?
        .0
        .clone();

    let min_bet =
        CURRENT_MIN_BET.load(deps.storage)? - BETS.get(deps.storage, &sender).unwrap_or(0);

    let num_revealed_cards = match current_game_state {
        GameState::NotStarted => unreachable!(),
        GameState::PreFlop => 0,
        GameState::Flop => 3,
        GameState::Turn => 4,
        GameState::River => 5,
    };

    let all_state = InGameStatus {
        balances,
        table: TABLE
            .iter(deps.storage)?
            .take(num_revealed_cards)
            .flatten()
            .collect(),
        pot: POT.load(deps.storage)?,
        hand: HANDS.get(deps.storage, &sender),
        current_turn,
        button_player,
        min_bet,
    };

    to_binary(&all_state)
}

use cosmwasm_std::{to_binary, Binary, CanonicalAddr, Deps, Env, StdError, StdResult};
use secret_toolkit::permit::Permit;

use crate::state::{
    get_balances, GameState, PreStartState, ADMIN, ALL_PLAYERS, BUTTON_POSITION,
    CURRENT_TURN_POSITION, HANDS, IS_STARTED, LOBBY_CONFIG, POT, REVEALED_CARDS, TABLE, USERNAMES,
};

pub fn query_pre_start_state(deps: Deps) -> StdResult<Binary> {
    let players: Vec<CanonicalAddr> = ALL_PLAYERS.iter(deps.storage)?.flatten().collect();

    let pre_start_state = PreStartState {
        admin: USERNAMES
            .get(deps.storage, &ADMIN.load(deps.storage)?)
            .unwrap(),
        lobby_config: LOBBY_CONFIG.load(deps.storage)?,
        is_started: IS_STARTED.load(deps.storage)?,
        balances: get_balances(&players, deps),
    };

    to_binary(&pre_start_state)
}

pub fn query_game_state(deps: Deps, env: Env, permit: Permit) -> StdResult<Binary> {
    if !IS_STARTED.load(deps.storage)? {
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

    let all_state = GameState {
        balances,
        table: TABLE
            .iter(deps.storage)?
            .take(REVEALED_CARDS.load(deps.storage)? as usize)
            .flatten()
            .collect(),
        pot: POT.load(deps.storage)?,
        hand: HANDS.get(deps.storage, &sender),
        current_turn,
        button_player,
    };

    to_binary(&all_state)
}

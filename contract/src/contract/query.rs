use cosmwasm_std::{to_binary, Binary, CanonicalAddr, Deps, Env, StdError, StdResult};
use secret_toolkit::permit::Permit;

use crate::state::{
    get_balances, Card, GameState, PreStartState, ADMIN, BIG_BLIND_POSITION, CURRENT_TURN_POSITION,
    HANDS, IS_STARTED, LOBBY_CONFIG, PLAYERS, POT, REVEALED_CARDS, TABLE, USERNAMES,
};

pub fn query_players(deps: Deps) -> StdResult<Binary> {
    let players: Vec<CanonicalAddr> = PLAYERS.iter(deps.storage)?.flatten().collect();
    let balances = get_balances(&players, deps);

    to_binary(&balances)
}

pub fn query_hand(deps: Deps, env: Env, permit: Permit) -> StdResult<Binary> {
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

    let Some(hand): Option<(Card, Card)> = HANDS.get(deps.storage, &sender) else {
        return Err(StdError::generic_err(
            "You do not currently have a hand in this game",
        ));
    };

    to_binary(&hand)
}

pub fn query_table(deps: Deps) -> StdResult<Binary> {
    let number_of_visiable_cards = REVEALED_CARDS.load(deps.storage)?;
    let cards: Vec<Card> = TABLE
        .iter(deps.storage)?
        .take(number_of_visiable_cards as usize)
        .flatten()
        .collect();

    to_binary(&cards)
}

pub fn query_lobby_config(deps: Deps) -> StdResult<Binary> {
    let lobby_config = LOBBY_CONFIG.load(deps.storage)?;

    to_binary(&lobby_config)
}

pub fn query_pre_start_state(deps: Deps) -> StdResult<Binary> {
    let players: Vec<CanonicalAddr> = PLAYERS.iter(deps.storage)?.flatten().collect();

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
    let is_started = IS_STARTED.load(deps.storage)?;
    if !is_started {
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

    let players: Vec<CanonicalAddr> = PLAYERS.iter(deps.storage)?.flatten().collect();
    let balances = get_balances(&players, deps);

    let current_turn = balances[CURRENT_TURN_POSITION.load(deps.storage)? as usize]
        .0
        .clone();
    let big_blind = balances[BIG_BLIND_POSITION.load(deps.storage)? as usize]
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
        big_blind,
    };

    to_binary(&all_state)
}

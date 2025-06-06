use cosmwasm_std::{to_binary, Binary, CanonicalAddr, Deps, Env, StdError, StdResult};
use secret_toolkit::permit::Permit;

use crate::state::{
    AllState, Card, ADMIN, BALANCES, GAME, HANDS, IS_STARTED, POT, REVEALED_CARDS, TABLE,
};

pub fn query_players(deps: Deps) -> StdResult<Binary> {
    let players: Vec<(CanonicalAddr, u128)> = BALANCES.iter(deps.storage)?.flatten().collect();

    to_binary(&players)
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

pub fn query_game(deps: Deps) -> StdResult<Binary> {
    let game = GAME.load(deps.storage)?;

    to_binary(&game)
}

pub fn query_all_state(deps: Deps) -> StdResult<Binary> {
    let all_state = AllState {
        admin: deps.api.addr_humanize(&ADMIN.load(deps.storage)?),
        big_blind: 1,
        is_started: IS_STARTED.load(deps.storage)?,
        players: BALANCES
            .iter(deps.storage)?
            .flatten()
            .map(|player| (deps.api.addr_humanize(&player.0), player.1))
            .collect(),
        table: TABLE
            .iter(deps.storage)?
            .take(REVEALED_CARDS.load(deps.storage)?)
            .flatten()
            .collect(),
        pot: POT.load(deps.storage)?,
    };

    to_binary(&all_state)
}

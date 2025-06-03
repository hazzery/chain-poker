use cosmwasm_std::{to_binary, Binary, CanonicalAddr, Deps, Env, StdError, StdResult};
use secret_toolkit::permit::Permit;

use crate::state::{Card, BALANCES, HANDS, REVEALED_CARDS, TABLE};

pub fn query_players(deps: Deps) -> StdResult<Binary> {
    let players: Vec<(CanonicalAddr, u128)> = BALANCES.iter(deps.storage)?.flatten().collect();

    to_binary(&players)
}

pub fn query_hand(deps: Deps, env: Env, permit: Permit) -> StdResult<Binary> {
    let account = secret_toolkit::permit::validate(
        deps,
        "revoked_permits",
        &permit,
        env.contract.address.to_string(),
        None,
    )?;

    let sender = deps.api.addr_canonicalize(&account)?;

    let Some(hand): Option<(Card, Card)> = HANDS.get(deps.storage, &sender) else {
        return Err(StdError::generic_err("You are not bought in!"));
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

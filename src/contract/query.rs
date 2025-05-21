use cosmwasm_std::{to_binary, Binary, Deps, Env, StdError, StdResult};
use secret_toolkit::permit::Permit;

use crate::state::{Card, Player, PLAYERS, REVEALED_CARDS, TABLE};

pub fn query_player(deps: Deps, env: Env, permit: Permit) -> StdResult<Binary> {
    let account = secret_toolkit::permit::validate(
        deps,
        "revoked_permits",
        &permit,
        env.contract.address.to_string(),
        None,
    )?;

    let sender = deps.api.addr_canonicalize(&account)?;

    let Some(player): Option<Player> = PLAYERS.get(deps.storage, &sender) else {
        return Err(StdError::generic_err("You are not bought in!"));
    };

    to_binary(&player)
}

pub fn query_table(deps: Deps) -> StdResult<Binary> {
    let number_of_visiable_cards = REVEALED_CARDS.load(deps.storage)?;
    let cards: Vec<Card> = TABLE
        .iter(deps.storage)?
        .take(number_of_visiable_cards)
        .filter(|card| card.is_ok())
        .map(|card| card.unwrap())
        .collect();

    to_binary(&cards)
}

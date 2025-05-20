use cosmwasm_std::{to_binary, Binary, Deps, Env, StdError, StdResult};
use secret_toolkit::permit::Permit;

use crate::state::{Card, Player, PLAYERS, TABLE};

pub fn query_hand(deps: Deps, env: Env, permit: Permit) -> StdResult<Binary> {
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

    to_binary(&player.hand)
}

pub fn query_table(deps: Deps) -> StdResult<Binary> {
    let cards: Vec<Card> = TABLE
        .iter(deps.storage)?
        .filter(|card| card.is_ok())
        .map(|card| card.unwrap())
        .collect();

    to_binary(&cards)
}

pub fn query_chip_count() -> StdResult<Binary> {
    to_binary("")
}

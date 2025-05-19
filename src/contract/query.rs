use cosmwasm_std::{Binary, Deps, Env, StdError, StdResult};
use secret_toolkit::permit::Permit;

use crate::state::{Player, PLAYERS};

pub fn query_hand(deps: Deps, env: Env, permit: Permit) -> StdResult<Binary> {
    let account = secret_toolkit::permit::validate(
        deps,
        "revoked_permits",
        &permit,
        env.contract.address.to_string(),
        None,
    )?;

    let sender = deps.api.addr_canonicalize(&account)?;

    let Some(player): Option<Player> = PLAYERS.get(deps.storage, sender) else {
        return Err(StdError::generic_err("You are not bought in!"));
    };

    return player.hand;
}

pub fn query_table() -> StdResult<Binary> {}

pub fn query_chip_count() -> StdResult<Binary> {}

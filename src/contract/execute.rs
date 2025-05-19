use cosmwasm_std::{Addr, DepsMut, Response, StdError, StdResult};

use crate::state::{Player, PLAYERS};

pub fn try_buy_in(deps: DepsMut, sender: Addr, value: u64) -> StdResult<Response> {
    let sender = deps.api.addr_canonicalize(sender.as_str())?;

    if PLAYERS.get(deps.storage, &sender).is_some() {
        return Err(StdError::generic_err("You have already bought in!"));
    }

    let player = Player {
        chip_count: 0,
        hand: None,
    };

    PLAYERS.insert(deps.storage, &sender, &player);

    Ok(Response::default())
}

pub fn try_place_bet(deps: DepsMut, sender: Addr, value: u64) -> StdResult<Response> {
    let sender = deps.api.addr_canonicalize(sender.as_str())?;

    let Some(ref mut player) = PLAYERS.get(deps.storage, &sender) else {
        return Err(StdError::generic_err("You are not bought in!"));
    };

    player.chip_count -= value;

    PLAYERS.insert(deps.storage, &sender, &player);

    Ok(Response::default())
}

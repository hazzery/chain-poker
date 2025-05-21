use cosmwasm_std::{Addr, CanonicalAddr, Coin, DepsMut, Response, StdError, StdResult};

use crate::state::{next_card, Player, IS_STARTED, PLAYERS, POT, TABLE};

pub fn try_start_game(deps: DepsMut) -> StdResult<Response> {
    if IS_STARTED.load(deps.storage)? {
        return Err(StdError::generic_err("The game has already started"));
    }

    let adresses: Vec<CanonicalAddr> = PLAYERS
        .iter_keys(deps.storage)?
        .filter(|key| key.is_ok())
        .map(|key| key.unwrap())
        .collect();

    for address in adresses {
        let Some(mut player) = PLAYERS.get(deps.storage, &address) else {
            unreachable!()
        };
        player.hand = Some((next_card(), next_card()));
        PLAYERS.insert(deps.storage, &address, &player)?;
    }

    for _ in 0..5 {
        TABLE.push(deps.storage, &next_card())?;
    }

    Ok(Response::default())
}

pub fn try_buy_in(deps: DepsMut, sender: Addr, funds: Vec<Coin>) -> StdResult<Response> {
    let sender = deps.api.addr_canonicalize(sender.as_str())?;

    if IS_STARTED.load(deps.storage)? {
        return Err(StdError::generic_err("The game has already started"));
    }

    if PLAYERS.get(deps.storage, &sender).is_some() {
        return Err(StdError::generic_err("You have already bought in!"));
    }

    if funds.len() != 1 {
        return Err(StdError::generic_err("Only SCRT is accepted"));
    }

    if funds[0].denom != "uscrt" {
        return Err(StdError::generic_err("Only SCRT is accepted"));
    }

    let player = Player {
        chip_count: funds[0].amount.u128(),
        hand: None,
    };

    PLAYERS.insert(deps.storage, &sender, &player)?;

    Ok(Response::default())
}

pub fn try_place_bet(deps: DepsMut, sender: Addr, value: u128) -> StdResult<Response> {
    if !IS_STARTED.load(deps.storage)? {
        return Err(StdError::generic_err("The has not started yet!"));
    }

    let sender = deps.api.addr_canonicalize(sender.as_str())?;

    let Some(mut player) = PLAYERS.get(deps.storage, &sender) else {
        return Err(StdError::generic_err("You are not bought in!"));
    };

    if value > player.chip_count {
        return Err(StdError::generic_err(
            "You do not have that many chips to bet with",
        ));
    }

    player.chip_count -= value;
    PLAYERS.insert(deps.storage, &sender, &player)?;

    POT.update(deps.storage, |pot| Ok(pot + value))?;

    Ok(Response::default())
}

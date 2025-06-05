use cosmwasm_std::{Addr, CanonicalAddr, Coin, DepsMut, Response, StdError, StdResult};

use crate::state::{next_card, BALANCES, HANDS, IS_STARTED, POT, TABLE};

pub fn try_start_game(deps: DepsMut) -> StdResult<Response> {
    if IS_STARTED.load(deps.storage)? {
        return Err(StdError::generic_err("The game has already started"));
    }

    if BALANCES.get_len(deps.storage)? < 2 {
        return Err(StdError::generic_err("Insufficient number of players"));
    }

    let adresses: Vec<CanonicalAddr> = BALANCES.iter_keys(deps.storage)?.flatten().collect();

    for address in adresses {
        let hand = (next_card(), next_card());
        HANDS.insert(deps.storage, &address, &hand)?;
    }

    (0..5).try_for_each(|_| TABLE.push(deps.storage, &next_card()))?;

    IS_STARTED.save(deps.storage, &true)?;

    Ok(Response::default())
}

pub fn try_buy_in(deps: DepsMut, sender: Addr, funds: Vec<Coin>) -> StdResult<Response> {
    if IS_STARTED.load(deps.storage)? {
        return Err(StdError::generic_err("The game has already started"));
    }

    let sender = deps.api.addr_canonicalize(sender.as_str())?;

    if BALANCES.get(deps.storage, &sender).is_some() {
        return Err(StdError::generic_err("You have already bought in!"));
    }

    if funds.len() != 1 {
        return Err(StdError::generic_err("Only SCRT is accepted"));
    }

    if funds[0].denom != "uscrt" {
        return Err(StdError::generic_err("Only SCRT is accepted"));
    }

    BALANCES.insert(deps.storage, &sender, &funds[0].amount.u128())?;

    Ok(Response::default())
}

pub fn try_place_bet(deps: DepsMut, sender: Addr, value: u128) -> StdResult<Response> {
    if !IS_STARTED.load(deps.storage)? {
        return Err(StdError::generic_err("The has not started yet!"));
    }

    let sender = deps.api.addr_canonicalize(sender.as_str())?;

    let Some(mut players_balance) = BALANCES.get(deps.storage, &sender) else {
        return Err(StdError::generic_err("You are not bought in!"));
    };

    if value > players_balance {
        return Err(StdError::generic_err(
            "You do not have that many chips to bet with",
        ));
    }

    players_balance -= value;
    BALANCES.insert(deps.storage, &sender, &players_balance)?;

    POT.update(deps.storage, |pot| Ok(pot + value))?;

    Ok(Response::default())
}

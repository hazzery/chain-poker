use cosmwasm_std::{Addr, CanonicalAddr, Coin, DepsMut, Response, StdError, StdResult, Storage};

use crate::state::{
    next_card, ADMIN, BALANCES, BIG_BLIND_POSITION, CURRENT_TURN_POSITION, GAME, HANDS, IS_STARTED,
    PLAYERS, POT, TABLE,
};

fn find_next_player<'a>(
    storage: &mut dyn Storage,
    player_position: u8,
    addresses: &'a [CanonicalAddr],
) -> StdResult<(u8, &'a CanonicalAddr, u128)> {
    addresses
        .iter()
        .cycle()
        .enumerate()
        .skip(player_position as usize)
        .take(addresses.len())
        .find_map(|(index, address)| Some((index as u8, address, BALANCES.get(storage, address)?)))
        .ok_or_else(|| StdError::generic_err("No players have remaining balance"))
}

fn take_forced_bet(
    take_amount: u32,
    player_position: u8,
    addresses: &[CanonicalAddr],
    storage: &mut dyn Storage,
) -> StdResult<u8> {
    let (index, address, mut balance) = find_next_player(storage, player_position, addresses)?;

    let bet_amount = if balance > take_amount as u128 {
        take_amount as u128
    } else {
        balance
    };

    balance -= bet_amount;
    BALANCES.insert(storage, address, &balance)?;

    POT.update(storage, |pot| Ok(pot + bet_amount))?;

    Ok(index)
}

fn new_round(storage: &mut dyn Storage, big_blind_player_position: u8) -> StdResult<()> {
    let addresses: Vec<CanonicalAddr> = PLAYERS.iter(storage)?.flatten().collect();

    addresses
        .iter()
        .try_for_each(|address| HANDS.insert(storage, address, &(next_card(), next_card())))?;

    (0..5).try_for_each(|_| TABLE.push(storage, &next_card()))?;

    let big_blind_amount = GAME.load(storage)?.big_blind;

    let big_blind_position = take_forced_bet(
        big_blind_amount,
        big_blind_player_position,
        &addresses,
        storage,
    )?;

    BIG_BLIND_POSITION.save(storage, &big_blind_position)?;

    let small_blind_position = take_forced_bet(
        big_blind_amount / 2,
        big_blind_position + 1,
        &addresses,
        storage,
    )?;

    CURRENT_TURN_POSITION.save(storage, &(small_blind_position + 1))?;

    Ok(())
}

pub fn try_start_game(deps: DepsMut, sender: Addr) -> StdResult<Response> {
    if IS_STARTED.load(deps.storage)? {
        return Err(StdError::generic_err("The game has already started"));
    }

    let admin = deps.api.addr_humanize(&ADMIN.load(deps.storage)?)?;
    if sender != admin {
        return Err(StdError::generic_err(
            "Only the person who created the lobby can start the game",
        ));
    }

    if PLAYERS.get_len(deps.storage)? < 2 {
        return Err(StdError::generic_err("Insufficient number of players"));
    }

    new_round(deps.storage, 0)?;

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

    PLAYERS.push(deps.storage, &sender)?;
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

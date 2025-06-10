use cosmwasm_std::{Addr, CanonicalAddr, Coin, DepsMut, Response, StdError, StdResult, Storage};

use crate::state::{
    next_card, ADMIN, BALANCES, BETS, BIG_BLIND_POSITION, CURRENT_MIN_BET, CURRENT_TURN_POSITION,
    HANDS, IS_STARTED, LOBBY_CONFIG, PLAYERS, POT, TABLE, USERNAMES,
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

fn take_bet(
    bet_amount: u128,
    players_balance: u128,
    total_bet: u128,
    players_address: &CanonicalAddr,
    storage: &mut dyn Storage,
) -> StdResult<()> {
    let remaining_balance = players_balance - bet_amount;

    if remaining_balance > 0 {
        BALANCES.insert(storage, players_address, &remaining_balance)?;
    } else {
        BALANCES.remove(storage, players_address)?;
    }

    BETS.insert(storage, players_address, &total_bet)?;
    POT.update(storage, |pot| Ok(pot + bet_amount))?;

    Ok(())
}

fn take_forced_bet(
    take_amount: u32,
    player_position: u8,
    addresses: &[CanonicalAddr],
    storage: &mut dyn Storage,
) -> StdResult<u8> {
    let (index, address, balance) = find_next_player(storage, player_position, addresses)?;

    let bet_amount = if balance > take_amount as u128 {
        take_amount as u128
    } else {
        balance
    };

    take_bet(bet_amount, balance, bet_amount, address, storage)?;

    Ok(index)
}

fn new_round(storage: &mut dyn Storage, big_blind_player_position: u8) -> StdResult<()> {
    let addresses: Vec<CanonicalAddr> = PLAYERS.iter(storage)?.flatten().collect();

    addresses
        .iter()
        .try_for_each(|address| HANDS.insert(storage, address, &(next_card(), next_card())))?;

    (0..5).try_for_each(|_| TABLE.push(storage, &next_card()))?;

    let big_blind_amount = LOBBY_CONFIG.load(storage)?.big_blind;
    CURRENT_MIN_BET.save(storage, &(big_blind_amount as u128))?;

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

    let next_player_position = find_next_player(storage, small_blind_position + 1, &addresses)?.0;

    CURRENT_TURN_POSITION.save(storage, &(next_player_position % addresses.len() as u8))?;

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

pub fn try_buy_in(
    username: String,
    deps: DepsMut,
    sender: Addr,
    funds: Vec<Coin>,
) -> StdResult<Response> {
    if IS_STARTED.load(deps.storage)? {
        return Err(StdError::generic_err("The game has already started"));
    }

    // TODO: Check if the username is already taken.

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
    USERNAMES.insert(deps.storage, &sender, &username)?;

    Ok(Response::default())
}

fn find_next_player_2(player_position: usize, storage: &mut dyn Storage) -> StdResult<u8> {
    let balance_finder = |(index, address)| {
        BALANCES.get(storage, &address)?;
        Some(index as u8)
    };

    if let Some(index) = PLAYERS
        .iter(storage)?
        .flatten()
        .enumerate()
        .skip(player_position)
        .find_map(balance_finder)
    {
        Ok(index)
    } else {
        PLAYERS
            .iter(storage)?
            .flatten()
            .enumerate()
            .take(player_position)
            .find_map(balance_finder)
            .ok_or_else(|| StdError::generic_err("No players have remaining balance"))
    }
}

pub fn try_place_bet(deps: DepsMut, sender: Addr, value: u128) -> StdResult<Response> {
    if !IS_STARTED.load(deps.storage)? {
        return Err(StdError::generic_err("The game has not started yet!"));
    }

    let sender = deps.api.addr_canonicalize(sender.as_str())?;
    let Some(players_balance) = BALANCES.get(deps.storage, &sender) else {
        return Err(StdError::generic_err("You are not bought in!"));
    };

    let current_turn_position = CURRENT_TURN_POSITION.load(deps.storage)?;
    if PLAYERS.get_at(deps.storage, current_turn_position as u32)? != sender {
        return Err(StdError::generic_err("It is not your turn to bet"));
    }

    if value > players_balance {
        return Err(StdError::generic_err(
            "You do not have that many chips to bet with",
        ));
    }

    let min_bet = CURRENT_MIN_BET.load(deps.storage)?;
    let previous_bet_amount = BETS.get(deps.storage, &sender).unwrap_or(0);

    if value == 0 {
        if previous_bet_amount < min_bet {
            HANDS.remove(deps.storage, &sender)?;
        }
    } else {
        let total_bet = previous_bet_amount + value;

        if total_bet < min_bet {
            return Err(StdError::generic_err(
                "Your total bet for this round does not meet the minimum bet",
            ));
        }

        if total_bet > min_bet {
            CURRENT_MIN_BET.save(deps.storage, &total_bet)?;
        }

        take_bet(value, players_balance, total_bet, &sender, deps.storage)?;
    }

    let next_player_position =
        find_next_player_2((current_turn_position + 1) as usize, deps.storage)?;

    CURRENT_TURN_POSITION.save(deps.storage, &next_player_position)?;

    Ok(Response::default())
}

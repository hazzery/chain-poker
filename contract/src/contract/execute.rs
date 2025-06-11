use cosmwasm_std::{Addr, CanonicalAddr, Coin, DepsMut, Response, StdError, StdResult, Storage};

use crate::state::{
    next_card, ADMIN, BALANCES, BETS, BUTTON_POSITION, CURRENT_MIN_BET, CURRENT_PLAYERS,
    CURRENT_TURN_POSITION, HANDS, IS_STARTED, LOBBY_CONFIG, POT, REVEALED_CARDS, TABLE, USERNAMES,
};

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
    storage: &mut dyn Storage,
) -> StdResult<()> {
    let player_address = CURRENT_PLAYERS.get_at(storage, player_position as u32)?;
    let players_balance = BALANCES
        .get(storage, &player_address)
        .ok_or(StdError::generic_err("A current player has no balance"))?;

    let bet_amount = if players_balance > take_amount as u128 {
        take_amount as u128
    } else {
        players_balance
    };

    take_bet(
        bet_amount,
        players_balance,
        bet_amount,
        &player_address,
        storage,
    )?;

    Ok(())
}

fn new_round(storage: &mut dyn Storage, button_position: u8) -> StdResult<()> {
    let mut addresses: Vec<CanonicalAddr> = USERNAMES.iter_keys(storage)?.flatten().collect();
    addresses.retain(|address| BALANCES.get(storage, address).is_some());

    addresses.iter().try_for_each(|address| {
        HANDS.insert(storage, address, &(next_card(), next_card()))?;
        CURRENT_PLAYERS.push(storage, &address)
    })?;

    (0..5).try_for_each(|_| TABLE.push(storage, &next_card()))?;

    let big_blind_amount = LOBBY_CONFIG.load(storage)?.big_blind;
    CURRENT_MIN_BET.save(storage, &(big_blind_amount as u128))?;
    BUTTON_POSITION.save(storage, &button_position)?;

    let num_players = addresses.len() as u8;

    // Small blind is immediately to the left of the button.
    let small_blind_player_position = (button_position + 1) % num_players;
    take_forced_bet(big_blind_amount / 2, small_blind_player_position, storage)?;

    // Big blind is immediately to the left of the small blind
    let big_blind_player_position = (small_blind_player_position + 1) % num_players;
    take_forced_bet(big_blind_amount, big_blind_player_position, storage)?;

    let next_player_position = (big_blind_player_position + 1) % num_players;
    CURRENT_TURN_POSITION.save(storage, &next_player_position)?;

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

    if CURRENT_PLAYERS.get_len(deps.storage)? < 2 {
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

    CURRENT_PLAYERS.push(deps.storage, &sender)?;
    BALANCES.insert(deps.storage, &sender, &funds[0].amount.u128())?;
    USERNAMES.insert(deps.storage, &sender, &username)?;

    Ok(Response::default())
}

fn next_play(storage: &mut dyn Storage) -> StdResult<()> {
    let current_num_cards = REVEALED_CARDS.load(storage)?;
    if current_num_cards == 0 {
        REVEALED_CARDS.save(storage, &3)?;
    } else if current_num_cards < 5 {
        REVEALED_CARDS.update(storage, |num_cards| Ok(num_cards + 1))?;
    }

    // TODO: Implement the showdown.

    Ok(())
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
    if CURRENT_PLAYERS.get_at(deps.storage, current_turn_position as u32)? != sender {
        return Err(StdError::generic_err("It is not your turn to bet"));
    }

    if value > players_balance {
        return Err(StdError::generic_err(
            "You do not have that many chips to bet with",
        ));
    }

    let mut min_bet = CURRENT_MIN_BET.load(deps.storage)?;
    let previous_bet_amount = BETS.get(deps.storage, &sender).unwrap_or(0);

    if value == 0 {
        if previous_bet_amount < min_bet {
            HANDS.remove(deps.storage, &sender)?;
            CURRENT_PLAYERS.remove(deps.storage, current_turn_position as u32)?;
        }
    } else {
        let total_bet = previous_bet_amount + value;

        if total_bet < min_bet {
            return Err(StdError::generic_err(
                "Your total bet for this round does not meet the minimum bet",
            ));
        }

        if total_bet > min_bet {
            min_bet = total_bet;
            CURRENT_MIN_BET.save(deps.storage, &min_bet)?;
        }

        take_bet(value, players_balance, total_bet, &sender, deps.storage)?;
    }

    let num_players = CURRENT_PLAYERS.get_len(deps.storage)? as u8;

    let mut next_player_position = (current_turn_position + 1) % num_players;
    let next_players_address = CURRENT_PLAYERS.get_at(deps.storage, next_player_position as u32)?;
    let next_players_bet = BETS.get(deps.storage, &next_players_address).unwrap_or(0);
    if next_players_bet == min_bet {
        next_play(deps.storage)?;
        next_player_position = (BUTTON_POSITION.load(deps.storage)? + 1) % num_players;
    }
    CURRENT_TURN_POSITION.save(deps.storage, &next_player_position)?;

    Ok(Response::default())
}

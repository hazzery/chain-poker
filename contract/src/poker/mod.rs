use cosmwasm_std::{CanonicalAddr, Env, StdError, StdResult, Storage};

use crate::state::{
    Deck, ALL_PLAYERS, BALANCES, BETS, BUTTON_POSITION, CURRENT_MIN_BET, CURRENT_TURN_POSITION,
    HANDS, LOBBY_CONFIG, POT, REVEALED_CARDS, TABLE,
};

pub fn find_next_player<'a>(
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
        .find_map(|(index, address)| {
            if !HANDS.contains(storage, address) {
                return None;
            }
            let balance = BALANCES.get(storage, address)?;
            Some(((index % addresses.len()) as u8, address, balance))
        })
        .ok_or_else(|| StdError::generic_err("No players have remaining balance"))
}

pub fn take_bet(
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
    let (index, player_address, players_balance) =
        find_next_player(storage, player_position, addresses)?;

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

    Ok(index)
}

pub fn new_round(button_position: u8, storage: &mut dyn Storage, env: &Env) -> StdResult<()> {
    let mut addresses: Vec<CanonicalAddr> = ALL_PLAYERS.iter(storage)?.flatten().collect();
    addresses.retain(|address| BALANCES.get(storage, address).is_some());

    let mut deck = Deck::new();
    let Some(ref random) = env.block.random else {
        return Err(StdError::generic_err("Random source was unavailable"));
    };

    addresses.iter().try_for_each(|address| {
        HANDS.insert(
            storage,
            address,
            &(deck.draw(&random.0)?, deck.draw(&random.0)?),
        )
    })?;

    (0..5).try_for_each(|_| TABLE.push(storage, &deck.draw(random)?))?;

    let big_blind_amount = LOBBY_CONFIG.load(storage)?.big_blind;
    CURRENT_MIN_BET.save(storage, &(big_blind_amount as u128))?;
    BUTTON_POSITION.save(storage, &button_position)?;

    // Small blind is immediately to the left of the button.
    let small_blind_player_position = take_forced_bet(
        big_blind_amount / 2,
        button_position + 1,
        &addresses,
        storage,
    )?;

    // Big blind is immediately to the left of the small blind
    let big_blind_player_position = take_forced_bet(
        big_blind_amount,
        small_blind_player_position + 1,
        &addresses,
        storage,
    )?;

    let next_player_position =
        find_next_player(storage, big_blind_player_position + 1, &addresses)?.0;
    CURRENT_TURN_POSITION.save(storage, &next_player_position)?;

    Ok(())
}

pub fn next_play(storage: &mut dyn Storage) -> StdResult<()> {
    let current_num_cards = REVEALED_CARDS.load(storage)?;
    if current_num_cards == 0 {
        REVEALED_CARDS.save(storage, &3)?;
    } else if current_num_cards < 5 {
        REVEALED_CARDS.update(storage, |num_cards| Ok(num_cards + 1))?;
    }

    // TODO: Implement the showdown.

    Ok(())
}

pub fn find_next_player_lazy(
    player_position: u8,
    storage: &mut dyn Storage,
) -> StdResult<(u8, CanonicalAddr)> {
    let eligibility_filter = |(index, address)| {
        if !HANDS.contains(storage, &address) || !BALANCES.contains(storage, &address) {
            return None;
        }
        Some((index as u8, address))
    };

    if let Some(user) = ALL_PLAYERS
        .iter(storage)?
        .flatten()
        .enumerate()
        .skip(player_position as usize)
        .find_map(eligibility_filter)
    {
        Ok(user)
    } else {
        ALL_PLAYERS
            .iter(storage)?
            .flatten()
            .enumerate()
            .take(player_position as usize)
            .find_map(eligibility_filter)
            .ok_or_else(|| StdError::generic_err("No players have remaining balance"))
    }
}

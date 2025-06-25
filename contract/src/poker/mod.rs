use cosmwasm_std::{Addr, CanonicalAddr, DepsMut, Env, Response, StdError, StdResult, Storage};

use poker_eval::{box_cards, Card, EvalClass, Rank, Suit};

use crate::state::{
    game_state::GameState, Deck, ALL_PLAYERS, BALANCES, BETS, BUTTON_POSITION, CURRENT_MIN_BET,
    CURRENT_STATE, CURRENT_TURN_POSITION, HANDS, LAST_RAISER, LOBBY_CONFIG, POT, TABLE,
};

pub fn betting_turn(
    sender: Addr,
    function: impl FnOnce(&CanonicalAddr, u8, &mut dyn Storage) -> StdResult<()>,
    deps: DepsMut,
    env: &Env,
) -> StdResult<Response> {
    if CURRENT_STATE.load(deps.storage)? == GameState::NotStarted {
        return Err(StdError::generic_err("The game has not started yet!"));
    }

    let sender = deps.api.addr_canonicalize(sender.as_str())?;
    if !HANDS.contains(deps.storage, &sender) {
        return Err(StdError::generic_err(
            "You do not have a hand is this round",
        ));
    };

    let current_turn_position = CURRENT_TURN_POSITION.load(deps.storage)?;
    if ALL_PLAYERS.get_at(deps.storage, current_turn_position as u32)? != sender {
        return Err(StdError::generic_err("It is not your turn to bet"));
    }

    function(&sender, current_turn_position, deps.storage)?;

    move_turn_position(current_turn_position, deps.storage, env)?;

    Ok(Response::default())
}

pub fn move_turn_position(
    current_turn_position: u8,
    storage: &mut dyn Storage,
    env: &Env,
) -> StdResult<()> {
    let num_players = ALL_PLAYERS.get_len(storage)? as u8;
    let last_raiser_position = LAST_RAISER.load(storage)?;

    let mut next_player_position =
        find_next_player_lazy((current_turn_position + 1) % num_players, storage)?.0;

    if next_player_position == last_raiser_position {
        let button_position = BUTTON_POSITION.load(storage)?;
        let mut left_of_button = (button_position + 1) % num_players;

        let is_end_of_hand = next_betting_round(storage)?;

        if is_end_of_hand {
            new_hand(left_of_button, storage, env)?;
            left_of_button = (left_of_button + 1) % num_players;
        };

        next_player_position = find_next_player_lazy(left_of_button, storage)?.0;
    }
    CURRENT_TURN_POSITION.save(storage, &next_player_position)?;

    return Ok(());
}

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
            let position = (index % addresses.len()) as u8;
            Some((position, address, balance))
        })
        .ok_or_else(|| StdError::generic_err("find_next_player found no elligible players"))
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

pub fn new_hand(button_position: u8, storage: &mut dyn Storage, env: &Env) -> StdResult<()> {
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

fn u8_to_card(card: u8) -> Card {
    let rank = match card % 13 {
        0 => Rank::Ace,
        1 => Rank::Two,
        2 => Rank::Three,
        3 => Rank::Four,
        4 => Rank::Five,
        5 => Rank::Six,
        6 => Rank::Seven,
        7 => Rank::Eight,
        8 => Rank::Nine,
        9 => Rank::Ten,
        10 => Rank::Jack,
        11 => Rank::Queen,
        12 => Rank::King,
        _ => unreachable!(),
    };
    let suit = match card / 13 {
        0 => Suit::Hearts,
        1 => Suit::Diamonds,
        2 => Suit::Clubs,
        3 => Suit::Spades,
        _ => unreachable!(),
    };

    Card::new(rank, suit)
}

fn u8s_to_cards(hand: (u8, u8)) -> (Card, Card) {
    (u8_to_card(hand.0), u8_to_card(hand.1))
}

fn distribute_pot(winners: &[&CanonicalAddr], storage: &mut dyn Storage) -> StdResult<()> {
    let pot_value = POT.load(storage)?;
    let individual_winnings = pot_value / winners.len() as u128;
    winners.iter().try_for_each(|address| {
        let balance = BALANCES.get(storage, address).unwrap_or(0);
        BALANCES.insert(storage, address, &(balance + individual_winnings))
    })?;

    let remaining_chips = pot_value % winners.len() as u128;
    if remaining_chips > 0 {
        let balance = BALANCES.get(storage, &winners[0]).unwrap();
        BALANCES.insert(storage, &winners[0], &(balance + remaining_chips))?;
    }

    Ok(())
}

fn showdown(players: &[CanonicalAddr], storage: &mut dyn Storage) -> StdResult<()> {
    let table: Vec<Card> = TABLE.iter(storage)?.flatten().map(u8_to_card).collect();
    let evaluator = poker_eval::Evaluator::new();

    let results: Vec<(&CanonicalAddr, EvalClass)> = players
        .iter()
        .filter_map(|address| {
            let hand: [Card; 2] = u8s_to_cards(HANDS.get(storage, &address)?).into();
            let cards = box_cards!(hand, table);
            let result = evaluator.evaluate(cards).ok()?.class();

            Some((address, result))
        })
        .collect();

    let highest_result = results.iter().map(|result| result.1).max().unwrap();

    // Collect all winners with the highest evaluation class
    let winners: Vec<&CanonicalAddr> = results
        .into_iter()
        .filter_map(|(address, result)| {
            if result == highest_result {
                Some(address)
            } else {
                None
            }
        })
        .collect();

    distribute_pot(&winners, storage)?;

    Ok(())
}

fn end_round(players: &[CanonicalAddr], storage: &mut dyn Storage) -> StdResult<()> {
    players.iter().try_for_each(|address| {
        HANDS.remove(storage, &address)?;
        BETS.remove(storage, &address)
    })?;

    TABLE.clear(storage);
    CURRENT_STATE.save(storage, &GameState::PreFlop)?;
    POT.save(storage, &0)?;
    Ok(())
}

pub fn next_betting_round(storage: &mut dyn Storage) -> StdResult<bool> {
    let current_game_state = CURRENT_STATE.load(storage)?;
    CURRENT_STATE.save(storage, &current_game_state.next())?;

    if current_game_state == GameState::River {
        let players: Vec<CanonicalAddr> = ALL_PLAYERS.iter(storage)?.flatten().collect();
        showdown(&players, storage)?;
        end_round(&players, storage)?;
        return Ok(true);
    }

    Ok(false)
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
            .ok_or_else(|| {
                StdError::generic_err("find_next_player_lazy found no elligible players")
            })
    }
}

use cosmwasm_std::{
    Addr, BankMsg, Coin, CosmosMsg, DepsMut, Env, Response, StdError, StdResult, Uint128,
};

use crate::{
    poker::{find_next_player_lazy, new_round, next_play, take_bet},
    state::{
        ADMIN, ALL_PLAYERS, BALANCES, BETS, BUTTON_POSITION, CURRENT_MIN_BET,
        CURRENT_TURN_POSITION, HANDS, IS_STARTED, LOBBY_CONFIG, USERNAMES,
    },
};

pub fn try_start_game(deps: DepsMut, sender: Addr, env: &Env) -> StdResult<Response> {
    if IS_STARTED.load(deps.storage)? {
        return Err(StdError::generic_err("The game has already started"));
    }

    let admin = deps.api.addr_humanize(&ADMIN.load(deps.storage)?)?;
    if sender != admin {
        return Err(StdError::generic_err(
            "Only the person who created the lobby can start the game",
        ));
    }

    if ALL_PLAYERS.get_len(deps.storage)? < 2 {
        return Err(StdError::generic_err("Insufficient number of players"));
    }

    new_round(0, deps.storage, env)?;

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

    let buy_in_amount = funds[0].amount.u128();

    let lobby_config = LOBBY_CONFIG.load(deps.storage)?;
    let min_buy_in = lobby_config.min_buy_in_bb as u32 * lobby_config.big_blind;
    let max_buy_in = lobby_config.max_buy_in_bb as u32 * lobby_config.big_blind;

    if buy_in_amount < min_buy_in as u128 {
        return Err(StdError::generic_err(format!(
            "You must buy in with at least {min_buy_in} uSCRT"
        )));
    }

    if buy_in_amount > max_buy_in as u128 {
        return Err(StdError::generic_err(format!(
            "You must buy in with at most {max_buy_in} uSCRT"
        )));
    }

    ALL_PLAYERS.push(deps.storage, &sender)?;
    BALANCES.insert(deps.storage, &sender, &buy_in_amount)?;
    USERNAMES.insert(deps.storage, &sender, &username)?;

    Ok(Response::default())
}

pub fn try_place_bet(sender: Addr, value: u128, deps: DepsMut, env: &Env) -> StdResult<Response> {
    if !IS_STARTED.load(deps.storage)? {
        return Err(StdError::generic_err("The game has not started yet!"));
    }

    let sender = deps.api.addr_canonicalize(sender.as_str())?;
    let Some(players_balance) = BALANCES.get(deps.storage, &sender) else {
        return Err(StdError::generic_err("You are not bought in!"));
    };

    let current_turn_position = CURRENT_TURN_POSITION.load(deps.storage)?;
    if ALL_PLAYERS.get_at(deps.storage, current_turn_position as u32)? != sender {
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

    let num_players = ALL_PLAYERS.get_len(deps.storage)? as u8;

    let (mut next_player_position, next_players_address) =
        find_next_player_lazy((current_turn_position + 1) % num_players, deps.storage)?;

    let next_players_bet = BETS.get(deps.storage, &next_players_address).unwrap_or(0);
    if next_players_bet == min_bet {
        let mut left_of_dealer = (BUTTON_POSITION.load(deps.storage)? + 1) % num_players;

        if next_play(deps.storage)? {
            new_round(left_of_dealer, deps.storage, env)?;
            left_of_dealer = (left_of_dealer + 1) % num_players;
        };

        next_player_position = find_next_player_lazy(left_of_dealer, deps.storage)?.0;
    }
    CURRENT_TURN_POSITION.save(deps.storage, &next_player_position)?;

    Ok(Response::default())
}

pub fn try_withdraw_chips(sender: Addr, deps: DepsMut) -> StdResult<Response> {
    let canonical_address = deps.api.addr_canonicalize(sender.as_str())?;
    let Some(balance) = BALANCES.get(deps.storage, &canonical_address) else {
        return Err(StdError::generic_err("You are not part of this game"));
    };

    if BETS.get(deps.storage, &canonical_address).is_some()
        && HANDS.get(deps.storage, &canonical_address).is_some()
    {
        return Err(StdError::generic_err(
            "You can only withdraw at the start of a new round, or after folding",
        ));
    }

    BALANCES.remove(deps.storage, &canonical_address)?;
    HANDS.remove(deps.storage, &canonical_address)?;
    BETS.remove(deps.storage, &canonical_address)?;

    let current_player_position = CURRENT_TURN_POSITION.load(deps.storage)?;
    let current_player_address =
        ALL_PLAYERS.get_at(deps.storage, current_player_position as u32)?;
    let num_players = ALL_PLAYERS.get_len(deps.storage)?;

    if current_player_address == canonical_address {
        let next_player_position =
            find_next_player_lazy((current_player_position + 1) % num_players, deps.storage);
        CURRENT_TURN_POSITION.save(deps.storage, next_player_position)?;
    }

    let coins_to_send: Vec<Coin> = vec![Coin {
        denom: "uscrt".to_string(),
        amount: Uint128::from(balance),
    }];

    let message = CosmosMsg::Bank(BankMsg::Send {
        to_address: sender.clone().into_string(),
        amount: coins_to_send,
    });

    Ok(Response::new().add_message(message))
}

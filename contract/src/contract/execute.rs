use cosmwasm_std::{
    Addr, BankMsg, CanonicalAddr, Coin, CosmosMsg, DepsMut, Env, Response, StdError, StdResult,
    Storage, Uint128,
};

use crate::{
    poker::{betting_turn, move_turn_position, new_hand, take_bet},
    state::{
        game_state::GameState, ADMIN, ALL_PLAYERS, BALANCES, BETS, CURRENT_MIN_BET, CURRENT_STATE,
        CURRENT_TURN_POSITION, HANDS, LAST_RAISER, LOBBY_CONFIG, USERNAMES,
    },
};

pub fn try_start_game(deps: DepsMut, sender: Addr, env: &Env) -> StdResult<Response> {
    if CURRENT_STATE.load(deps.storage)? != GameState::NotStarted {
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

    CURRENT_STATE.save(deps.storage, &GameState::PreFlop)?;

    let players: Vec<CanonicalAddr> = ALL_PLAYERS.iter(deps.storage)?.flatten().collect();
    let next_player_position = new_hand(&players, 0, deps.storage, env)?;
    CURRENT_TURN_POSITION.save(deps.storage, &next_player_position)?;

    Ok(Response::default())
}

pub fn try_buy_in(
    username: String,
    deps: DepsMut,
    sender: Addr,
    funds: Vec<Coin>,
) -> StdResult<Response> {
    if CURRENT_STATE.load(deps.storage)? != GameState::NotStarted {
        return Err(StdError::generic_err("The game has already started"));
    }

    if ALL_PLAYERS.get_len(deps.storage)? >= 9 {
        return Err(StdError::generic_err(
            "There are already the maximum number of people in this lobby",
        ));
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

pub fn try_fold(sender: Addr, deps: DepsMut, env: &Env) -> StdResult<Response> {
    let fold_action =
        |address: &CanonicalAddr, _, storage: &mut dyn Storage| HANDS.remove(storage, address);
    betting_turn(sender, fold_action, deps, env)
}

pub fn try_check(sender: Addr, deps: DepsMut, env: &Env) -> StdResult<Response> {
    let check_action = |address: &CanonicalAddr, _, storage: &mut dyn Storage| {
        let senders_current_bet = BETS.get(storage, address).unwrap_or(0);
        let current_min_bet = CURRENT_MIN_BET.load(storage)?;
        if senders_current_bet < current_min_bet {
            return Err(StdError::generic_err("You are not currently able to check"));
        }

        Ok(())
    };
    betting_turn(sender, check_action, deps, env)
}

pub fn try_call(sender: Addr, deps: DepsMut, env: &Env) -> StdResult<Response> {
    let call_action = |address: &CanonicalAddr, _, storage: &mut dyn Storage| {
        let call_amount = CURRENT_MIN_BET.load(storage)?;
        let players_balance = BALANCES.get(storage, address).unwrap();
        let players_current_bet = BETS.get(storage, address).unwrap_or(0);
        let bet_amount = call_amount - players_current_bet;

        if bet_amount > players_balance {
            return Err(StdError::generic_err(
                "You do not have enough chips to call",
            ));
        }

        take_bet(bet_amount, players_balance, call_amount, address, storage)?;

        Ok(())
    };
    betting_turn(sender, call_action, deps, env)
}

pub fn try_raise(
    sender: Addr,
    raise_amount: u128,
    deps: DepsMut,
    env: &Env,
) -> StdResult<Response> {
    let raise_action =
        |address: &CanonicalAddr, current_position: u8, storage: &mut dyn Storage| {
            let players_balance = BALANCES.get(storage, address).unwrap();
            let current_bet = BETS.get(storage, address).unwrap_or(0);
            let total_bet = current_bet + raise_amount;

            if raise_amount > players_balance {
                return Err(StdError::generic_err(
                    "You do not have that many chips to bet with",
                ));
            }

            LAST_RAISER.save(storage, &current_position)?;
            CURRENT_MIN_BET.save(storage, &total_bet)?;

            take_bet(raise_amount, players_balance, total_bet, address, storage)?;

            Ok(())
        };
    betting_turn(sender, raise_action, deps, env)
}

pub fn try_withdraw_chips(sender: Addr, deps: DepsMut, env: &Env) -> StdResult<Response> {
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

    if current_player_address == canonical_address {
        move_turn_position(current_player_position, deps.storage, env)?;
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

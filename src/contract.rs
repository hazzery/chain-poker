mod execute;
mod query;

use cosmwasm_std::{
    entry_point, to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdError, StdResult,
    Storage,
};
use execute::{try_buy_in, try_place_bet};
use query::{query_chip_count, query_hand, query_table};

use crate::{
    msg::{ExecuteMsg, InstantiateMsg, QueryMsg},
    state::{Game, GAME},
};

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    let game = Game {
        big_blind: msg.big_blind,
        max_buy_in_bb: msg.max_buy_in_bb,
        min_buy_in_bb: msg.min_buy_in_bb,
    };
    GAME.save(deps.storage, &game);
    Ok(Response::default())
}

#[entry_point]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> StdResult<Response> {
    match msg {
        ExecuteMsg::BuyIn { value } => try_buy_in(deps, info.sender, value),
        ExecuteMsg::PlaceBet { value } => try_place_bet(),
    }
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::ViewChipCount => query_chip_count(),
        QueryMsg::ViewHand => query_hand(),
        QueryMsg::ViewTable => query_table(),
    }
}

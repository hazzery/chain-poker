mod execute;
mod query;

use cosmwasm_std::{entry_point, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult};
use execute::{try_buy_in, try_place_bet, try_start_game};
use query::{query_all_state, query_game, query_hand, query_players, query_table};

use crate::{
    msg::{ExecuteMsg, InstantiateMsg, QueryMsg},
    state::{Game, ADMIN, GAME, IS_STARTED, POT, REVEALED_CARDS},
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
    let admin_canonical_address = deps.api.addr_canonicalize(info.sender.as_str())?;

    ADMIN.save(deps.storage, &admin_canonical_address)?;
    GAME.save(deps.storage, &game)?;
    REVEALED_CARDS.save(deps.storage, &0)?;
    IS_STARTED.save(deps.storage, &false)?;
    POT.save(deps.storage, &0)?;

    Ok(Response::default())
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> StdResult<Response> {
    match msg {
        ExecuteMsg::StartGame {} => try_start_game(deps, info.sender),
        ExecuteMsg::BuyIn {} => try_buy_in(deps, info.sender, info.funds),
        ExecuteMsg::PlaceBet { value } => try_place_bet(deps, info.sender, value.into()),
    }
}

#[entry_point]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::ViewPlayers {} => query_players(deps),
        QueryMsg::ViewHand { permit } => query_hand(deps, env, permit),
        QueryMsg::ViewTable {} => query_table(deps),
        QueryMsg::ViewGame {} => query_game(deps),
        QueryMsg::ViewAllState {} => query_all_state(deps),
    }
}

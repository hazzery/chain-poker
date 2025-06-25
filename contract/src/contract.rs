mod execute;
mod query;

use cosmwasm_std::{
    entry_point, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdError, StdResult,
};
use execute::{
    try_buy_in, try_call, try_check, try_fold, try_raise, try_start_game, try_withdraw_chips,
};
use query::{query_game_state, query_pre_start_state};

use crate::{
    msg::{ExecuteMsg, InstantiateMsg, QueryMsg},
    state::{
        game_state::GameState, LobbyConfig, ADMIN, CURRENT_STATE, LOBBY_CONFIG, POT, USERNAMES,
    },
};

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    if msg.min_buy_in_bb > msg.max_buy_in_bb {
        return Err(StdError::generic_err(
            "Min buy in must be less than or equal to the max buy in",
        ));
    }

    let lobby_config = LobbyConfig {
        big_blind: msg.big_blind,
        max_buy_in_bb: msg.max_buy_in_bb,
        min_buy_in_bb: msg.min_buy_in_bb,
    };
    let admin_canonical_address = deps.api.addr_canonicalize(info.sender.as_str())?;

    ADMIN.save(deps.storage, &admin_canonical_address)?;
    USERNAMES.insert(deps.storage, &admin_canonical_address, &msg.username)?;
    CURRENT_STATE.save(deps.storage, &GameState::NotStarted)?;
    LOBBY_CONFIG.save(deps.storage, &lobby_config)?;
    POT.save(deps.storage, &0)?;

    Ok(Response::default())
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> StdResult<Response> {
    match msg {
        ExecuteMsg::StartGame {} => try_start_game(deps, info.sender, &env),
        ExecuteMsg::BuyIn { username } => try_buy_in(username, deps, info.sender, info.funds),
        ExecuteMsg::Fold {} => try_fold(info.sender, deps, &env),
        ExecuteMsg::Check {} => try_check(info.sender, deps, &env),
        ExecuteMsg::Call {} => try_call(info.sender, deps, &env),
        ExecuteMsg::Raise { raise_amount } => {
            try_raise(info.sender, raise_amount.into(), deps, &env)
        }
        ExecuteMsg::Withdraw {} => try_withdraw_chips(info.sender, deps),
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::ViewLobbyStatus {} => query_pre_start_state(deps),
        QueryMsg::ViewGameStatus { permit } => query_game_state(deps, env, permit),
    }
}

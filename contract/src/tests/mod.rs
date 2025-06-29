mod util;

use cosmwasm_std::testing::mock_dependencies;

use util::{
    buy_in, call, find_balance, query_game_status, query_lobby_status, start_game,
    valid_instantiation, VALID_LOBBY_CONFIG, VALID_MAX_BUY_IN, VALID_MIN_BUY_IN, VALID_USERNAME,
};

#[test]
fn test_instantiation_valid_message() {
    let mut deps = mock_dependencies();

    valid_instantiation(deps.as_mut());

    let lobby_status = query_lobby_status(deps.as_ref());
    assert_eq!(VALID_USERNAME, lobby_status.admin);
    assert_eq!(false, lobby_status.is_started);
    assert_eq!(0, lobby_status.balances.len());
    assert_eq!(VALID_LOBBY_CONFIG, lobby_status.lobby_config);
}

#[test]
fn test_buy_in_with_max_buy_in() {
    let mut deps = mock_dependencies();

    valid_instantiation(deps.as_mut());
    buy_in("anyone", VALID_MAX_BUY_IN, deps.as_mut());

    let lobby_status = query_lobby_status(deps.as_ref());
    assert_eq!(1, lobby_status.balances.len());
    assert_eq!(
        (VALID_USERNAME.to_string(), VALID_MAX_BUY_IN),
        lobby_status.balances[0]
    );
}

#[test]
fn test_buy_in_with_min_buy_in() {
    let mut deps = mock_dependencies();

    valid_instantiation(deps.as_mut());
    buy_in("anyone", VALID_MIN_BUY_IN, deps.as_mut());

    let lobby_status = query_lobby_status(deps.as_ref());
    assert_eq!(1, lobby_status.balances.len());
    assert_eq!(
        (VALID_USERNAME.to_string(), VALID_MIN_BUY_IN),
        lobby_status.balances[0]
    );
}

#[test]
fn test_start_game_as_admin() {
    let mut deps = mock_dependencies();

    let first_buyer = "first_user";
    let second_buyer = "second_user";

    valid_instantiation(deps.as_mut());
    buy_in(first_buyer, VALID_MIN_BUY_IN, deps.as_mut());
    buy_in(second_buyer, VALID_MIN_BUY_IN, deps.as_mut());
    start_game(deps.as_mut());

    let lobby_status = query_lobby_status(deps.as_ref());
    assert_eq!(true, lobby_status.is_started);

    let game_status = query_game_status(first_buyer, deps.as_ref());
    let first_buyers_balance = find_balance(first_buyer, &game_status.balances);
    let second_buyers_balance = find_balance(second_buyer, &game_status.balances);
    assert_eq!(
        VALID_MIN_BUY_IN - VALID_LOBBY_CONFIG.big_blind,
        first_buyers_balance
    );
    assert_eq!(
        VALID_MIN_BUY_IN - VALID_LOBBY_CONFIG.big_blind / 2,
        second_buyers_balance
    );
}

#[test]
fn test_call_sufficient_balance() {
    let mut deps = mock_dependencies();

    let first_buyer = "first_user";
    let second_buyer = "second_user";

    valid_instantiation(deps.as_mut());
    buy_in(first_buyer, VALID_MIN_BUY_IN, deps.as_mut());
    buy_in(second_buyer, VALID_MIN_BUY_IN, deps.as_mut());
    start_game(deps.as_mut());
    call(&first_buyer, deps.as_mut());

    let game_status = query_game_status(first_buyer, deps.as_ref());
    // assert_eq!(game_status.)
}

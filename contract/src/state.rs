mod rank;
mod suit;

use cosmwasm_std::{Addr, CanonicalAddr, Deps, StdResult};
use secret_toolkit::{
    serialization::Bincode2,
    storage::{AppendStore, Item, Keymap, KeymapBuilder, WithoutIter},
};
use serde::{Deserialize, Serialize};

use rank::Rank;
use suit::Suit;

pub static GAME: Item<Game> = Item::new(b"game");
pub static PLAYERS: AppendStore<CanonicalAddr> = AppendStore::new(b"players");
pub static HANDS: Keymap<CanonicalAddr, (Card, Card), Bincode2, WithoutIter> =
    KeymapBuilder::new(b"hands").without_iter().build();
pub static BALANCES: Keymap<CanonicalAddr, u128, Bincode2, WithoutIter> =
    KeymapBuilder::new(b"balances").without_iter().build();
pub static TABLE: AppendStore<Card> = AppendStore::new(b"table");
pub static REVEALED_CARDS: Item<u8> = Item::new(b"num_revealed");
pub static POT: Item<u128> = Item::new(b"pot");
pub static IS_STARTED: Item<bool> = Item::new(b"started");
pub static ADMIN: Item<CanonicalAddr> = Item::new(b"admin");
pub static CURRENT_TURN_POSITION: Item<u8> = Item::new(b"current_turn");
pub static BIG_BLIND_POSITION: Item<u8> = Item::new(b"current_big_blind");

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq)]
pub struct Card {
    pub suit: Suit,
    pub rank: Rank,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Game {
    pub big_blind: u32,
    pub max_buy_in_bb: u8,
    pub min_buy_in_bb: u8,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PreStartState {
    pub admin: Addr,
    pub lobby_config: Game,
    pub is_started: bool,
    pub balances: Vec<(Addr, u128)>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AllState {
    pub admin: Addr,
    pub lobby_config: Game,
    pub is_started: bool,
    pub balances: Vec<(Addr, u128)>,
    pub table: Vec<Card>,
    pub pot: u128,
    pub hand: Option<(Card, Card)>,
    pub current_turn: Addr,
    pub big_blind: Addr,
}

pub fn next_card() -> Card {
    Card {
        rank: Rank::Queen,
        suit: Suit::Hearts,
    }
}

pub fn get_balances(addresses: &[CanonicalAddr], deps: Deps) -> StdResult<Vec<(Addr, u128)>> {
    addresses
        .iter()
        .map(|canonical_address| {
            let address = deps.api.addr_humanize(canonical_address)?;
            let balance_option = BALANCES.get(deps.storage, canonical_address);
            Ok(balance_option.map(|balance| (address, balance)))
        })
        .filter_map(|result| result.transpose())
        .collect()
}

mod rank;
mod suit;

use cosmwasm_std::{Addr, CanonicalAddr};
use secret_toolkit::{
    serialization::Bincode2,
    storage::{AppendStore, Item, Keymap, KeymapBuilder, WithoutIter},
};
use serde::{Deserialize, Serialize};

use rank::Rank;
use suit::Suit;

pub static GAME: Item<Game> = Item::new(b"game");
pub static HANDS: Keymap<CanonicalAddr, (Card, Card), Bincode2, WithoutIter> =
    KeymapBuilder::new(b"hands").without_iter().build();
pub static BALANCES: Keymap<CanonicalAddr, u128> = Keymap::new(b"balances");
pub static TABLE: AppendStore<Card> = AppendStore::new(b"table");
pub static REVEALED_CARDS: Item<u8> = Item::new(b"num_revealed");
pub static POT: Item<u128> = Item::new(b"pot");
pub static IS_STARTED: Item<bool> = Item::new(b"started");
pub static ADMIN: Item<CanonicalAddr> = Item::new(b"admin");

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

pub struct AllState {
    pub admin: Addr,
    pub big_blind: u32,
    pub is_started: bool,
    pub players: Vec<(Addr, u128)>,
    pub table: Option<Vec<Card>>,
    pub pot: u128,
}

pub fn next_card() -> Card {
    Card {
        rank: Rank::Queen,
        suit: Suit::Hearts,
    }
}

mod rank;
mod suit;

use cosmwasm_std::CanonicalAddr;
use secret_toolkit::storage::{AppendStore, Item, Keymap};
use serde::{Deserialize, Serialize};

use rank::Value;
use suit::Suit;

pub static GAME: Item<Game> = Item::new(b"game");
pub static PLAYERS: Keymap<CanonicalAddr, Player> = Keymap::new(b"players");
pub static TABLE: AppendStore<Card> = AppendStore::new(b"table");
pub static REVEALED_CARDS: Item<u8> = Item::new(b"num_revealed");
pub static POT: Item<u128> = Item::new(b"pot");
pub static IS_STARTED: Item<bool> = Item::new(b"started");

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq)]
pub struct Card {
    pub suit: Suit,
    pub value: Value,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct Player {
    pub hand: Option<(Card, Card)>,
    pub chip_count: u128,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Game {
    pub big_blind: u32,
    pub max_buy_in_bb: u8,
    pub min_buy_in_bb: u8,
}

pub fn next_card() -> Card {
    Card {
        value: Value::Queen,
        suit: Suit::Hearts,
    }
}

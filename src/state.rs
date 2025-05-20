use secret_toolkit::storage::{AppendStore, Item, Keymap};
use serde::{Deserialize, Serialize};

use cosmwasm_std::CanonicalAddr;

pub static GAME: Item<Game> = Item::new(b"game");
pub static PLAYERS: Keymap<CanonicalAddr, Player> = Keymap::new(b"players");
pub static TABLE: AppendStore<Card> = AppendStore::new(b"table");

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq)]
pub enum Suit {
    Hearts,
    Diamonds,
    Clubs,
    Spades,
}

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq)]
pub enum Value {
    Ace,
    One,
    Two,
    Three,
    Four,
    Five,
    Six,
    Seven,
    Eight,
    Nine,
    Ten,
    Jack,
    Queen,
    King,
}

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq)]
pub struct Card {
    pub suit: Suit,
    pub value: Value,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct Player {
    pub hand: Option<(Card, Card)>,
    pub chip_count: u64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Game {
    pub big_blind: u32,
    pub max_buy_in_bb: u8,
    pub min_buy_in_bb: u8,
}

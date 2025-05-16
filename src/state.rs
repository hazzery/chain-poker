use schemars::JsonSchema;
use secret_toolkit::storage::Item;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{Addr, Storage};
use cosmwasm_storage::{singleton, singleton_read, ReadonlySingleton, Singleton};

pub static GAME: Item<Game> = Item::new(b"game");

pub enum Suit {
    Hearts,
    Diamonds,
    Clubs,
    Spades,
}

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

pub struct Card {
    pub suit: Suit,
    pub value: Value,
}

pub struct Player {
    pub hand: Option<(Card, Card)>,
}

pub struct Game {
    pub table: Vec<Card>,
    pub players: Vec<Player>,
}

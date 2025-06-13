mod rank;
mod suit;

use cosmwasm_std::{CanonicalAddr, Deps};
use secret_toolkit::{
    serialization::Bincode2,
    storage::{AppendStore, Item, Keymap, KeymapBuilder, WithoutIter},
};
use serde::{Deserialize, Serialize};

use rank::Rank;
use suit::Suit;

pub static LOBBY_CONFIG: Item<LobbyConfig> = Item::new(b"lobby_config");
pub static ALL_PLAYERS: AppendStore<CanonicalAddr> = AppendStore::new(b"players");
pub static USERNAMES: Keymap<CanonicalAddr, String, Bincode2, WithoutIter> =
    KeymapBuilder::new(b"usernames").without_iter().build();
pub static HANDS: Keymap<CanonicalAddr, (Card, Card), Bincode2, WithoutIter> =
    KeymapBuilder::new(b"hands").without_iter().build();
pub static BALANCES: Keymap<CanonicalAddr, u128, Bincode2, WithoutIter> =
    KeymapBuilder::new(b"balances").without_iter().build();
pub static TABLE: AppendStore<Card> = AppendStore::new(b"table");
pub static REVEALED_CARDS: Item<u8> = Item::new(b"num_revealed");
pub static POT: Item<u128> = Item::new(b"pot");
pub static CURRENT_MIN_BET: Item<u128> = Item::new(b"min_bet");
pub static BETS: Keymap<CanonicalAddr, u128, Bincode2, WithoutIter> =
    KeymapBuilder::new(b"bets").without_iter().build();
pub static IS_STARTED: Item<bool> = Item::new(b"started");
pub static ADMIN: Item<CanonicalAddr> = Item::new(b"admin");
pub static CURRENT_TURN_POSITION: Item<u8> = Item::new(b"current_turn");
pub static BUTTON_POSITION: Item<u8> = Item::new(b"button_position");

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq)]
pub struct Card {
    pub suit: Suit,
    pub rank: Rank,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LobbyConfig {
    pub big_blind: u32,
    pub max_buy_in_bb: u8,
    pub min_buy_in_bb: u8,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PreStartState {
    pub admin: String,
    pub lobby_config: LobbyConfig,
    pub is_started: bool,
    pub balances: Vec<(String, u128)>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GameState {
    pub balances: Vec<(String, u128)>,
    pub table: Vec<Card>,
    pub pot: u128,
    pub hand: Option<(Card, Card)>,
    pub current_turn: String,
    pub button_player: String,
}

pub fn next_card() -> Card {
    Card {
        rank: Rank::Queen,
        suit: Suit::Hearts,
    }
}

pub fn get_balances(addresses: &[CanonicalAddr], deps: Deps) -> Vec<(String, u128)> {
    addresses
        .iter()
        .filter_map(|canonical_address| {
            let username = USERNAMES.get(deps.storage, canonical_address)?;
            let balance = BALANCES.get(deps.storage, canonical_address)?;
            Some((username, balance))
        })
        .collect()
}

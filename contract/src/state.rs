use cosmwasm_std::{CanonicalAddr, Deps, StdError, StdResult};
use secret_toolkit::{
    serialization::Bincode2,
    storage::{AppendStore, Item, Keymap, KeymapBuilder, WithoutIter},
};
use serde::{Deserialize, Serialize};

pub static LOBBY_CONFIG: Item<LobbyConfig> = Item::new(b"lobby_config");
pub static ALL_PLAYERS: AppendStore<CanonicalAddr> = AppendStore::new(b"players");
pub static USERNAMES: Keymap<CanonicalAddr, String, Bincode2, WithoutIter> =
    KeymapBuilder::new(b"usernames").without_iter().build();
pub static HANDS: Keymap<CanonicalAddr, (u8, u8), Bincode2, WithoutIter> =
    KeymapBuilder::new(b"hands").without_iter().build();
pub static BALANCES: Keymap<CanonicalAddr, u128, Bincode2, WithoutIter> =
    KeymapBuilder::new(b"balances").without_iter().build();
pub static TABLE: AppendStore<u8> = AppendStore::new(b"table");
pub static REVEALED_CARDS: Item<u8> = Item::new(b"num_revealed");
pub static POT: Item<u128> = Item::new(b"pot");
pub static CURRENT_MIN_BET: Item<u128> = Item::new(b"min_bet");
pub static BETS: Keymap<CanonicalAddr, u128, Bincode2, WithoutIter> =
    KeymapBuilder::new(b"bets").without_iter().build();
pub static IS_STARTED: Item<bool> = Item::new(b"started");
pub static ADMIN: Item<CanonicalAddr> = Item::new(b"admin");
pub static CURRENT_TURN_POSITION: Item<u8> = Item::new(b"current_turn");
pub static BUTTON_POSITION: Item<u8> = Item::new(b"button_position");

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
    pub table: Vec<u8>,
    pub pot: u128,
    pub hand: Option<(u8, u8)>,
    pub current_turn: String,
    pub button_player: String,
}

pub struct Deck {
    // Cards are represented with numbers 0..52
    cards: Vec<u8>,
    index: usize,
}

impl Deck {
    pub fn new() -> Self {
        Self {
            cards: (0..52).collect(),
            index: 0,
        }
    }

    pub fn draw(&mut self, seed: &[u8]) -> StdResult<u8> {
        // Get the next byte from the randomness source.
        let random_byte = *seed.get(self.index).ok_or(StdError::generic_err(format!(
            "self.index ({}) out of range for seed (length {})",
            self.index,
            seed.len(),
        )))?;

        let deck_size = self.cards.len();

        // Force the number to be within the size of the deck, excluding used cards.
        let random_deck_index = random_byte as usize % (deck_size - self.index);
        let card = *self
            .cards
            .get(random_deck_index)
            .ok_or(StdError::generic_err(format!(
                "random_deck_index ({random_deck_index}) out of range for self.cards (length {})",
                deck_size,
            )))?;

        // Move the card we have just picked to the back of the deck, to prevent reselection.
        self.cards.swap(random_deck_index, deck_size - self.index);

        self.index += 1;

        Ok(card)
    }
}

pub fn get_balances(addresses: &[CanonicalAddr], deps: Deps) -> Vec<(String, u128)> {
    addresses
        .iter()
        .filter_map(|canonical_address| {
            let username = USERNAMES.get(deps.storage, canonical_address)?;
            let balance = BALANCES.get(deps.storage, canonical_address).unwrap_or(0);
            Some((username, balance))
        })
        .collect()
}

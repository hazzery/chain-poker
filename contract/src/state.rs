use rand::{rngs::StdRng, Rng, SeedableRng};

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
    index: u8,
    rng: StdRng,
}

impl Deck {
    pub fn new(seed: Vec<u8>) -> StdResult<Self> {
        let length = seed.len();
        let seed_array: [u8; 32] = seed
            .try_into()
            .map_err(|_| StdError::generic_err(format!("Seed was length {length}")))?;

        Ok(Self {
            cards: (0..52).collect(),
            index: 0,
            rng: StdRng::from_seed(seed_array),
        })
    }

    pub fn draw(&mut self) -> u8 {
        let random_index = self.rng.random_range(self.index as usize..self.cards.len());
        let card = self.cards[random_index];
        self.cards.swap(random_index, self.index as usize);
        self.index += 1;

        card
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

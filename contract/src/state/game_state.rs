use serde::{de::Error, Deserialize, Serialize};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum GameState {
    NotStarted,
    PreFlop,
    Flop,
    Turn,
    River,
}

impl GameState {
    pub const fn next(self) -> GameState {
        match self {
            GameState::NotStarted => GameState::PreFlop,
            GameState::PreFlop => GameState::Flop,
            GameState::Flop => GameState::Turn,
            GameState::Turn => GameState::River,
            GameState::River => GameState::PreFlop,
        }
    }
}

impl Serialize for GameState {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_i32(*self as i32)
    }
}

impl<'de> Deserialize<'de> for GameState {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let value = i32::deserialize(deserializer)?;
        match value {
            0 => Ok(GameState::NotStarted),
            1 => Ok(GameState::PreFlop),
            2 => Ok(GameState::Flop),
            3 => Ok(GameState::Turn),
            4 => Ok(GameState::River),
            _ => Err(Error::custom("Invalid Rank value")),
        }
    }
}

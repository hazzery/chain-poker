import { Box } from "@mui/material";

import { ChipCount } from "../ChipCount";
import { CardSet } from "../components/CardSet";
import FanLayout from "../components/FanLayout";
import { Hand } from "../components/Hand";
import { Rank, Suit } from "../components/PlayingCard";

function Game() {
  const playersHand = [
    { suit: Suit.Hearts, rank: Rank.Ace },
    { suit: Suit.Diamonds, rank: Rank.Ace },
  ];

  const table = [
    { suit: Suit.Clubs, rank: Rank.Ace },
    { suit: Suit.Clubs, rank: Rank.Seven },
    { suit: Suit.Diamonds, rank: Rank.Two },
    { suit: Suit.Hearts, rank: Rank.Two },
    { suit: Suit.Spades, rank: Rank.Four },
  ];

  const players = [
    { name: "John", chipBalance: 70 },
    { name: "James", chipBalance: 80 },
    { name: "Jimmy", chipBalance: 90 },
    { name: "Jeff", chipBalance: 60 },
    { name: "Jake", chipBalance: 50 },
    { name: "Jacob", chipBalance: 110 },
    { name: "Jack", chipBalance: 120 },
    { name: "Jamie", chipBalance: 70 },
  ];

  const currentPot = 10;
  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <FanLayout players={players}>
        <CardSet cards={table} />
        <ChipCount
          numberOfChips={currentPot}
          chipIconSize="3em"
          fontSize="2em"
          sx={{ justifyContent: "center", display: "flex" }}
        />
      </FanLayout>
      <Hand cards={playersHand} chipBalance={97.5} />
    </Box>
  );
}

export default Game;

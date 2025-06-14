import { Card, Typography } from "@mui/material";
import {
  RiPokerClubsFill,
  RiPokerDiamondsFill,
  RiPokerHeartsFill,
  RiPokerSpadesFill,
} from "react-icons/ri";

const enum Suit {
  Hearts,
  Diamonds,
  Clubs,
  Spades,
}

const enum Rank {
  Ace = "A",
  Two = "2",
  Three = "3",
  Four = "4",
  Five = "5",
  Six = "6",
  Seven = "7",
  Eight = "8",
  Nine = "9",
  Ten = "10",
  Jack = "J",
  Queen = "Q",
  King = "K",
}

const RANKS = [
  Rank.Ace,
  Rank.Two,
  Rank.Three,
  Rank.Four,
  Rank.Five,
  Rank.Six,
  Rank.Seven,
  Rank.Eight,
  Rank.Nine,
  Rank.Ten,
  Rank.Jack,
  Rank.Queen,
  Rank.King,
];

interface PlayingCardProps {
  suit: Suit;
  rank: Rank;
}

function suitIcon(suit: Suit) {
  switch (suit) {
    case Suit.Hearts:
      return <RiPokerHeartsFill size="4em" color="red" />;
    case Suit.Diamonds:
      return <RiPokerDiamondsFill size="4em" color="red" />;
    case Suit.Spades:
      return <RiPokerSpadesFill size="4em" color="black" />;
    case Suit.Clubs:
      return <RiPokerClubsFill size="4em" color="black" />;
  }
}

function PlayingCard({ suit, rank }: PlayingCardProps) {
  return (
    <Card
      sx={{
        width: "6em",
        height: "9em",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        borderRadius: "5%",
      }}
    >
      <Typography
        color={suit === Suit.Hearts || suit === Suit.Diamonds ? "red" : "black"}
        fontSize="3em"
      >
        {rank}
      </Typography>
      {suitIcon(suit)}
    </Card>
  );
}

export { PlayingCard as default, RANKS, Suit };

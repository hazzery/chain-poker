import CssBaseline from "@mui/material/CssBaseline";

import "./app.css";
import NavBar from "./components/NavBar";
import PlayingCard, { Rank, Suit } from "./components/PlayingCard";
export function App() {
  return (
    <>
      <CssBaseline />
      <NavBar></NavBar>
      <PlayingCard suit={Suit.Hearts} rank={Rank.Jack} />
      <PlayingCard suit={Suit.Clubs} rank={Rank.Ace} />
      <PlayingCard suit={Suit.Spades} rank={Rank.Ten} />
      <PlayingCard suit={Suit.Diamonds} rank={Rank.Two} />
      <PlayingCard suit={Suit.Hearts} rank={Rank.Seven} />
      <PlayingCard suit={Suit.Hearts} rank={Rank.King} />
    </>
  );
}

import { useMediaQuery } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useMemo } from "preact/hooks";

import "./app.css";
import { CardSet } from "./components/CardSet";
import NavBar from "./components/NavBar";
import { Rank, Suit } from "./components/PlayingCard";
import { Hand } from "./components/Hand";

export function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? "dark" : "light",
        },
      }),
    [prefersDarkMode],
  );

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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NavBar></NavBar>
      <CardSet cards={table} />
      <Hand cards={playersHand} />
    </ThemeProvider>
  );
}

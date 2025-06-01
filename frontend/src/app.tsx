import { useMediaQuery } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useMemo } from "preact/hooks";
import { Router, Route, LocationProvider } from "preact-iso";

import "./app.css";
import Landing from "./pages/Landing";
import Game from "./pages/Game";
import NotFound from "./pages/NotFound";
import NavBar from "./components/NavBar";

export interface PlayerInfo {
  name: string;
  chipBalance: number;
}

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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NavBar />
      <LocationProvider>
        <Router>
          <Route path="/" component={Landing} />
          <Route path="/play" component={Game} />
          <Route default component={NotFound} />
        </Router>
      </LocationProvider>
    </ThemeProvider>
  );
}

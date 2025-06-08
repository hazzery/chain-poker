import { useMediaQuery } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { LocationProvider, Route, Router } from "preact-iso";
import { useMemo } from "preact/hooks";

import "./app.css";
import NavBar from "./components/NavBar";
import Landing from "./pages/Landing";
import Lobby from "./pages/Lobby";
import NotFound from "./pages/NotFound";
import Play from "./pages/Play";
import Reconnect from "./pages/Reconnect";
import { NetworkClientContextProvider } from "./secretnetwork/SecretNetworkContext";

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
        <NetworkClientContextProvider>
          <Router>
            <Route path="/" component={Landing} />
            <Route path="/play/:lobbyCode" component={Play} />
            <Route path="/lobby/:lobbyCode" component={Lobby} />
            <Route path="/play/:lobbyCode/reconnect" component={Reconnect} />
            <Route default component={NotFound} />
          </Router>
        </NetworkClientContextProvider>
      </LocationProvider>
    </ThemeProvider>
  );
}

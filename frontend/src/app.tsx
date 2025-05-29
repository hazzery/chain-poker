import { useMediaQuery } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useMemo } from "preact/hooks";

import "./app.css";
import ConnectWallet from "./pages/ConnectWallet";
import Landing from "./pages/Landing";
import { SecretJsContextProvider } from "./secretnetwork/secretNetworkContext";

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
      <SecretJsContextProvider>
        {/* <Landing /> */}
        <ConnectWallet />
      </SecretJsContextProvider>
    </ThemeProvider>
  );
}

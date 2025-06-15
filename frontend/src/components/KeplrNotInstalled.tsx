import { Typography } from "@mui/material";
import ChainPoker from "./ChainPoker";

function KeplrNotInstalled() {
  return (
    <ChainPoker>
      <Typography>
        Keplr Wallet is not installed. Please install the Keplr Wallet browser
        extension to use Chain Poker
      </Typography>
    </ChainPoker>
  );
}

export default KeplrNotInstalled;

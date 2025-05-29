import { Button, Card } from "@mui/material";

import { secretNetworkContext } from "../secretnetwork/secretNetworkContext";
import { useContext } from "preact/hooks";
import type { ReactNode } from "preact/compat";

function ConnectWallet(): ReactNode {
  const secretContext = useContext(secretNetworkContext);
  if (secretContext === null) {
    console.error("SecretNetworkContext was null!");
    return;
  }
  const { connectWallet } = secretContext;

  async function connectWalletWrapper(): Promise<void> {
    (await connectWallet()).onFailure((error) => alert(error));
  }

  return (
    <Card sx={{ padding: "3em" }}>
      <Button onClick={connectWalletWrapper}>Connect Wallet</Button>
    </Card>
  );
}

export default ConnectWallet;

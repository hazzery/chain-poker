import { SecretNetworkClient } from "secretjs";

interface SecretNetworkState {
  networkClient: SecretNetworkClient;
  walletAddress: string;
  disconnectWallet: () => void;
}

export type { SecretNetworkState };

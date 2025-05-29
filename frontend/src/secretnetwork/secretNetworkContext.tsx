import type { Dispatch, ReactNode, SetStateAction } from "react";
import { createContext, useState } from "react";
import { SecretNetworkClient } from "secretjs";
import Err from "../../../node/src/err";
import { Result } from "typescript-result";

// can make these .env vars instead
const SECRET_CHAIN_ID = import.meta.env.VITE_SECRET_CHAIN_ID;
const SECRET_LCD = import.meta.env.VITE_SECRET_LCD;

declare global {
  interface Window {
    keplr?: any;
    getEnigmaUtils?: (chainId: string) => any;
    getOfflineSignerOnlyAmino?: (chainId: string) => any;
  }
}

interface SecretNetworkContext {
  networkClient: SecretNetworkClient | null;
  setNetworkClient: Dispatch<SetStateAction<SecretNetworkClient | null>>;
  secretAddress: string;
  setSecretAddress: Dispatch<SetStateAction<string>>;
  connectWallet: () => Promise<Result<void, Error>>;
  disconnectWallet: () => void;
}

// Create the context with undefined default (will be provided by the provider)
const secretNetworkContext = createContext<SecretNetworkContext | null>(null);

interface SecretNetworkContextProviderProps {
  children: ReactNode;
}

function SecretNetworkContextProvider({
  children,
}: SecretNetworkContextProviderProps): ReactNode {
  const [networkClient, setNetworkClient] =
    useState<SecretNetworkClient | null>(null);
  const [secretAddress, setSecretAddress] = useState<string>("");

  async function setupKeplr(
    setNetworkClient: Dispatch<SetStateAction<SecretNetworkClient | null>>,
    setSecretAddress: Dispatch<SetStateAction<string>>,
  ): Promise<void> {
    function sleep(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    while (
      !window.keplr ||
      !window.getEnigmaUtils ||
      !window.getOfflineSignerOnlyAmino
    ) {
      await sleep(50);
    }

    await window.keplr.enable(SECRET_CHAIN_ID);

    window.keplr.defaultOptions = {
      sign: {
        preferNoSetFee: false,
        disableBalanceCheck: true,
      },
    };

    const keplrOfflineSigner =
      window.getOfflineSignerOnlyAmino(SECRET_CHAIN_ID);
    const accounts = await keplrOfflineSigner.getAccounts();

    const secretAddress = accounts[0].address;

    const networkClient = new SecretNetworkClient({
      url: SECRET_LCD,
      chainId: SECRET_CHAIN_ID,
      wallet: keplrOfflineSigner,
      walletAddress: secretAddress,
      encryptionUtils: window.getEnigmaUtils(SECRET_CHAIN_ID),
    });

    setSecretAddress(secretAddress);
    setNetworkClient(networkClient);
  }

  async function connectWallet(): Promise<Result<void, Error>> {
    if (!window.keplr) {
      return Err("Keplr Wallet is not installed!");
    }
    return await Result.fromAsyncCatching(
      setupKeplr(setNetworkClient, setSecretAddress),
    ).onSuccess(() => localStorage.setItem("keplrAutoConnect", "true"));
  }

  function disconnectWallet(): void {
    setSecretAddress("");
    setNetworkClient(null);

    // disable auto connect
    localStorage.setItem("keplrAutoConnect", "false");

    console.log("Wallet disconnected!");
  }

  return (
    <secretNetworkContext.Provider
      value={{
        networkClient,
        setNetworkClient,
        secretAddress,
        setSecretAddress,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </secretNetworkContext.Provider>
  );
}

export { SECRET_CHAIN_ID, secretNetworkContext, SecretNetworkContextProvider };

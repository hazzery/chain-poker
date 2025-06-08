import { createContext, type VNode } from "preact";
import {
  useContext,
  useState,
  type Dispatch,
  type StateUpdater,
} from "preact/hooks";
import type { SecretNetworkClient } from "secretjs";
import { Result } from "typescript-result";

import initialseNetworkClient from "./keplrWallet";

interface NetworkClient {
  networkClient: SecretNetworkClient | null;
  setNetworkClient: Dispatch<StateUpdater<SecretNetworkClient | null>>;
  disconnectWallet: () => void;
}

// Create the context, defaulting to null (will be provided by the provider)
const NetworkClientContext = createContext<NetworkClient>({
  networkClient: null,
  setNetworkClient: () => {},
  disconnectWallet: () => {},
});

function useNetworkClient(): SecretNetworkClient | null | undefined {
  const networkContext = useContext(NetworkClientContext);

  if (networkContext.networkClient === null) {
    if (window.keplr === undefined) {
      return null;
    }

    Result.fromAsync(initialseNetworkClient(window.keplr))
      .onSuccess(networkContext.setNetworkClient)
      .onFailure(console.error);
    return;
  }

  return networkContext.networkClient;
}

function useNetworkContext(): NetworkClient {
  return useContext(NetworkClientContext);
}

// Props for the provider component
interface NetworkClientContextProviderProps {
  children: VNode | VNode[];
}

function NetworkClientContextProvider({
  children,
}: NetworkClientContextProviderProps): VNode {
  const [networkClient, setNetworkClient] =
    useState<SecretNetworkClient | null>(null);

  function disconnectWallet(): void {
    // Remove connected network client.
    setNetworkClient(null);

    // Disable auto connect
    localStorage.setItem("keplrAutoConnect", "false");
  }

  return (
    <NetworkClientContext.Provider
      value={{
        networkClient,
        setNetworkClient,
        disconnectWallet,
      }}
    >
      {children}
    </NetworkClientContext.Provider>
  );
}

export { NetworkClientContextProvider, useNetworkClient, useNetworkContext };

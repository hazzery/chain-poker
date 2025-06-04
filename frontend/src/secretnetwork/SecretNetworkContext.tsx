import type { SecretNetworkClient } from "secretjs";
import {
  useContext,
  useState,
  type Dispatch,
  type StateUpdater,
} from "preact/hooks";
import { createContext, type VNode } from "preact";

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

function useNetworkClient(): NetworkClient {
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

export { useNetworkClient, NetworkClientContextProvider };

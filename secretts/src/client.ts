import { SecretNetworkClient, Wallet } from "secretjs";

const MAINNET_ENDPOINT = "https://lcd.mainnet.secretsaturn.net";
const MAINNET_NAME = "secret-4";
const TESTNET_ENDPOINT = "https://pulsar.lcd.secretnodes.com";
const TESTNET_NAME = "pulsar-3";
const LOCALNET_ENDPOINT = "http://localhost:1317";
const LOCALNET_NAME = "secretdev-1";

enum Network {
  Mainnet,
  Testnet,
  Localnet,
}

/**
 * Initialise a new network client for the specified network.
 *
 * @param network - The network to initialise a client for.
 * @param walletMnemonic - An optional private key to link the client to an
 *    existing wallet.
 * @returns An array containing the network client and the wallet it was
 *    initialised with.
 */
function initialiseNetworkClient(
  network: Network,
  walletMnemonic = "",
): SecretNetworkClient {
  let endpoint: string;
  let networkName: string;
  const wallet = new Wallet(walletMnemonic);

  switch (network) {
    case Network.Mainnet:
      endpoint = MAINNET_ENDPOINT;
      networkName = MAINNET_NAME;
      break;
    case Network.Testnet:
      endpoint = TESTNET_ENDPOINT;
      networkName = TESTNET_NAME;
      break;
    case Network.Localnet:
      endpoint = LOCALNET_ENDPOINT;
      networkName = LOCALNET_NAME;
      break;
  }

  const client = new SecretNetworkClient({
    url: endpoint,
    chainId: networkName,
    wallet: wallet,
    walletAddress: wallet.address,
  });

  return client;
}

export { initialiseNetworkClient, Network };

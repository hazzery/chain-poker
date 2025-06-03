import type { Keplr } from "@keplr-wallet/types";
import { SecretNetworkClient } from "secretjs";
import { Result } from "typescript-result";

const SECRET_LCD = import.meta.env.VITE_SECRET_LCD;
const SECRET_CHAIN_ID = import.meta.env.VITE_SECRET_CHAIN_ID;

/**
 * Initialise a Secret Network client with the user's Keplr Wallet.
 *
 * @param keplr The global Keplr wallet instance (window.keplr).
 *
 * @returns An array containing a network client initialised with the user's
 *    Keplr Wallet and the user's Secret Network address.
 */
async function initialseNetworkClient(
  keplr: Keplr,
): Promise<Result<SecretNetworkClient, Error>> {
  return await Result.fromAsyncCatching(keplr.enable(SECRET_CHAIN_ID)).map(
    async () => {
      keplr.defaultOptions = {
        sign: {
          preferNoSetFee: false,
          disableBalanceCheck: true,
        },
      };

      const signer = keplr.getOfflineSignerOnlyAmino(SECRET_CHAIN_ID);
      const walletAddress = (await signer.getAccounts())[0].address;
      const networkClient = new SecretNetworkClient({
        url: SECRET_LCD,
        chainId: SECRET_CHAIN_ID,
        wallet: signer,
        walletAddress,
        encryptionUtils: keplr.getEnigmaUtils(SECRET_CHAIN_ID),
      });

      Result.try(() =>
        localStorage.setItem("keplrAutoConnect", "true"),
      ).onFailure(alert);

      return networkClient;
    },
  );
}

export default initialseNetworkClient;

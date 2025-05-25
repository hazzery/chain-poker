import dotenv from "dotenv";
import { SecretNetworkClient, Wallet } from "secretjs";
import { Result } from "typescript-result";

/**
 * Create a wallet object using the mnemonic value stored in a `.env` file.
 *
 * @returns A result containing an array of a wallet a secret network contract
 *    if "MNEOMONIC" was present in the `.env` file, a string error message
 *    otherwise.
 */
function instantiateClient(): Result<[SecretNetworkClient, Wallet], string> {
  dotenv.config();

  if (process.env.MNEMONIC === undefined) {
    return Result.error("Wallet mnemonic was not found in environment");
  }

  const wallet = new Wallet(process.env.MNEMONIC);

  return Result.ok([
    new SecretNetworkClient({
      chainId: "pulsar-3",
      url: "https://pulsar.lcd.secretnodes.com",
      wallet: wallet,
      walletAddress: wallet.address,
    }),
    wallet,
  ]);
}

export default instantiateClient;

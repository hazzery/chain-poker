import dotenv from "dotenv";
import { Err, initialiseNetworkClient, Network, tryExecute } from "secretts";
import { Result } from "typescript-result";

import { readInstantiateData } from "./src/io";

/**
 * Instantiate the contract.
 *
 * @returns A result of nothing if execution was successfull, otherwise a string
 *    error message.
 */
async function main(): Promise<Result<void, Error>> {
  dotenv.config();

  if (process.env.MNEMONIC2 === undefined) {
    return Err("Wallet mnemonic was not found in environment");
  }

  const networkClient = initialiseNetworkClient(
    Network.Testnet,
    process.env.MNEMONIC2,
  );

  const executeMessage = {
    place_bet: { value: "0" },
  };
  const gasLimit = 400_000;

  return await Result.fromAsync(readInstantiateData())
    .map((instantiateData) =>
      tryExecute(executeMessage, gasLimit, instantiateData, networkClient),
    )
    .map(() => {});
}

await Result.fromAsync(main()).onFailure((error) => {
  console.error(error);
  process.exit(1);
});

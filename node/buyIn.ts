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

  if (
    process.env.MNEMONIC === undefined ||
    process.env.MNEMONIC2 === undefined ||
    process.env.MNEMONIC3 === undefined
  ) {
    return Err("Wallet mnemonic was not found in environment");
  }

  const johnsClient = initialiseNetworkClient(
    Network.Testnet,
    process.env.MNEMONIC2,
  );

  const joshsClient = initialiseNetworkClient(
    Network.Testnet,
    process.env.MNEMONIC3,
  );

  const [instantiateData, instantiateDataError] = await Result.fromAsync(
    readInstantiateData(),
  ).toTuple();
  if (instantiateDataError) {
    return Result.error(instantiateDataError);
  }

  const johnsResult = await tryExecute(
    { buy_in: { username: "John" } },
    400_000,
    instantiateData,
    johnsClient,
    4,
  );

  if (johnsResult.isError()) {
    return johnsResult;
  }

  return await tryExecute(
    { buy_in: { username: "Josh" } },
    400_000,
    instantiateData,
    joshsClient,
    4,
  ).map(() => {});
}

await Result.fromAsync(main()).onFailure((error) => {
  console.error(error);
  process.exit(1);
});

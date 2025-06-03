import dotenv from "dotenv";
import {
  Err,
  initialiseNetworkClient,
  Network,
  queryContract,
  signPermit,
} from "secretts";
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

  if (process.env.MNEMONIC === undefined) {
    return Err("Wallet mnemonic was not found in environment");
  }

  const networkClient = initialiseNetworkClient(
    Network.Testnet,
    process.env.MNEMONIC,
  );

  const instantiateDataResult = await Result.fromAsync(readInstantiateData());
  const permitResult = await instantiateDataResult.map((instantiateData) =>
    signPermit(instantiateData.contractAddress, "", networkClient, false),
  );

  const [permit, error] = permitResult.toTuple();
  if (error) {
    return Result.error(error);
  }

  return await instantiateDataResult
    .map((instantiateData) =>
      queryContract(
        { view_player: { permit } },
        instantiateData,
        networkClient,
      ),
    )
    .onSuccess(console.log)
    .map(() => {});
}

await Result.fromAsync(main()).onFailure((error) => {
  console.error(error);
  process.exit(1);
});

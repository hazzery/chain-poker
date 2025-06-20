import dotenv from "dotenv";
import {
  Err,
  initialiseNetworkClient,
  instantiateContract,
  Network,
} from "secretts";
import { Result } from "typescript-result";

import { readUploadData, writeInstantiaionData } from "./src/io";

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

  const instantiationMessage = {
    username: "Hazza",
    big_blind: 500000,
    max_buy_in_bb: 50,
    min_buy_in_bb: 1,
  };
  const gasLimit = 400_000;

  return await Result.fromAsync(readUploadData())
    .map((uploadData) =>
      instantiateContract(
        instantiationMessage,
        gasLimit,
        uploadData,
        networkClient,
      ),
    )
    .map(writeInstantiaionData);
}

await Result.fromAsync(main()).onFailure((error) => {
  console.error(error);
  process.exit(1);
});

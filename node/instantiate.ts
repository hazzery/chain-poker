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

  const [networkClient, wallet] = initialiseNetworkClient(
    Network.Testnet,
    process.env.MNEMONIC,
  );

  const instantiationMessage = {
    big_blind: 1_000_000n,
    max_buy_in_bb: 100n,
    min_buy_in_bb: 50n,
  };
  const gasLimit = 400_000;

  return await Result.fromAsync(readUploadData())
    .map((uploadData) =>
      instantiateContract(
        instantiationMessage,
        gasLimit,
        uploadData,
        wallet.address,
        networkClient,
      ),
    )
    .map(writeInstantiaionData);
}

await Result.fromAsync(main()).onFailure((error) => {
  console.error(error);
  process.exit(1);
});

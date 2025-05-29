import dotenv from "dotenv";
import { Result } from "typescript-result";

import { initialiseNetworkClient, Network } from "./src/client";
import Err from "./src/err";
import instantiateContract from "./src/instantiate";
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
    big_blind: 1_000_000,
    max_buy_in_bb: 100,
    min_buy_in_bb: 50,
  };
  const gasLimit = 400_000;

  return await Result.fromAsync(readUploadData())
    .map((uploadData) =>
      instantiateContract(
        instantiationMessage,
        gasLimit,
        uploadData,
        wallet,
        networkClient,
      ),
    )
    .map(writeInstantiaionData);
}

await Result.fromAsync(main()).onFailure(console.error);

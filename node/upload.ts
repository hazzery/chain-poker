import dotenv from "dotenv";
import * as fs from "fs";
import { Result } from "typescript-result";

import { initialiseNetworkClient, Network } from "./src/client";
import Err from "./src/err";
import { writeUploadData } from "./src/node/io";
import uploadContract from "./src/upload";

/**
 * Upload the compiled contract's binary Web Assembly code to the network.
 *
 * @returns A result of nothing if execution is sucessfull, otherwise a string
 * error message.
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

  const contractWasmPath = "../contract/optimized-wasm/chain_poker.wasm.gz";
  const gasLimit = 4_000_000;

  return await Result.fromAsyncCatching(fs.promises.readFile(contractWasmPath))
    .map((contractWasm) =>
      uploadContract(gasLimit, wallet, networkClient, contractWasm),
    )
    .map(writeUploadData);
}

await Result.fromAsync(main()).onFailure(console.error);

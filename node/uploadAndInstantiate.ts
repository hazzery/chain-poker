import dotenv from "dotenv";
import * as fs from "fs";
import { Result } from "typescript-result";

import { initialiseNetworkClient, Network } from "./src/client";
import instantiateContract from "./src/instantiate";
import { writeInstantiaionData } from "./src/io";
import uploadContract from "./src/upload";

async function main(): Promise<Result<void, string>> {
  dotenv.config();

  if (process.env.MNEMONIC === undefined) {
    return Result.error("Wallet mnemonic was not found in environment");
  }

  const [networkClient, wallet] = initialiseNetworkClient(Network.Testnet);

  const contractWasmPath = "../contract/optimized-wasm/chain_poker.wasm.gz";
  const uploadGasLimit = 4_000_000;
  const instantiateGasLimit = 400_000;
  const instantiationMessage = {};

  return await Result.fromAsyncCatching(fs.promises.readFile(contractWasmPath))
    .map((contractWasm) =>
      uploadContract(uploadGasLimit, wallet, networkClient, contractWasm),
    )
    .mapError(String)
    .map((uploadData) =>
      instantiateContract(
        instantiationMessage,
        instantiateGasLimit,
        uploadData,
        wallet,
        networkClient,
      ),
    )
    .map(writeInstantiaionData);
}

await Result.fromAsync(main()).onFailure(console.error);

import dotenv from "dotenv";
import * as fs from "fs";
import {
  Err,
  initialiseNetworkClient,
  instantiateContract,
  Network,
  uploadContract,
} from "secretts";
import { Result } from "typescript-result";

import { writeInstantiaionData } from "./src/io";

async function main(): Promise<Result<void, Error>> {
  dotenv.config();

  if (process.env.MNEMONIC === undefined) {
    return Err("Wallet mnemonic was not found in environment");
  }

  const [networkClient, wallet] = initialiseNetworkClient(Network.Testnet);

  const contractWasmPath = "../contract/optimized-wasm/chain_poker.wasm.gz";
  const uploadGasLimit = 4_000_000;
  const instantiateGasLimit = 400_000;
  const instantiationMessage = {
    big_blind: 1_000_000n,
    max_buy_in_bb: 100n,
    min_buy_in_bb: 50n,
  };

  return await Result.fromAsyncCatching(fs.promises.readFile(contractWasmPath))
    .map((contractWasm) =>
      uploadContract(uploadGasLimit, wallet, networkClient, contractWasm),
    )
    .map((uploadData) =>
      instantiateContract(
        instantiationMessage,
        instantiateGasLimit,
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

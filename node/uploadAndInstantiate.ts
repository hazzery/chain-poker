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

import { writeInstantiaionData, writeUploadData } from "./src/io";

async function main(): Promise<Result<void, Error>> {
  dotenv.config();

  if (process.env.MNEMONIC === undefined) {
    return Err("Wallet mnemonic was not found in environment");
  }

  const networkClient = initialiseNetworkClient(
    Network.Testnet,
    process.env.MNEMONIC,
  );

  const contractWasmPath = "../contract/optimized-wasm/chain_poker.wasm.gz";
  const uploadGasLimit = 4_000_000;
  const instantiateGasLimit = 400_000;
  const instantiationMessage = {
    username: "Hazza",
    big_blind: 2,
    max_buy_in_bb: 100,
    min_buy_in_bb: 1,
  };

  const [uploadData, uploadDataError] = await Result.fromAsyncCatching(
    fs.promises.readFile(contractWasmPath),
  )
    .map((contractWasm) =>
      uploadContract(uploadGasLimit, networkClient, contractWasm),
    )
    .toTuple();

  if (uploadDataError) {
    return Result.error(uploadDataError);
  }

  const writeUploadDataResult = await writeUploadData(uploadData);
  if (writeUploadDataResult.isError()) {
    return writeUploadDataResult;
  }

  return await instantiateContract(
    instantiationMessage,
    instantiateGasLimit,
    uploadData,
    networkClient,
  ).map(writeInstantiaionData);
}

await Result.fromAsync(main()).onFailure((error) => {
  console.error(error);
  process.exit(1);
});

import * as fs from "fs";
import { SecretNetworkClient } from "secretjs";
import {
  initialiseNetworkClient,
  instantiateContract,
  InstantiateData,
  Network,
  uploadContract,
} from "secretts";
import { Result } from "typescript-result";

import { fillUpFromFaucet } from "../src/utils";
import { test_buy_in } from "./suite";

interface ContractClient {
  networkClient: SecretNetworkClient;
  instantiateData: InstantiateData;
}

async function initializeAndUploadContract(): Promise<
  Result<ContractClient, Error>
> {
  const networkClient = initialiseNetworkClient(Network.Localnet);

  const faucetResult = await fillUpFromFaucet(networkClient, 100_000_000);
  if (faucetResult.isError()) {
    return faucetResult;
  }

  const wasmPath = "../../contract/optimized-wasm/chain_poker.wasm.gz";
  const gasLimit = 400_000;
  const instantiationMessage = {
    big_blind: 1_000_000,
    max_buy_in_bb: 100,
    min_buy_in_bb: 50,
  };

  return await Result.fromAsyncCatching(fs.promises.readFile(wasmPath))
    .map((contractWasm) =>
      uploadContract(gasLimit, networkClient, contractWasm),
    )
    .map((uploadData) =>
      instantiateContract(
        instantiationMessage,
        gasLimit,
        uploadData,
        networkClient,
      ),
    )
    .map((instantiateData) => ({ networkClient, instantiateData }));
}

async function runTestFunction(
  tester: (contractClient: ContractClient) => Promise<boolean>,
  contractClient: ContractClient,
): Promise<void> {
  console.log(`Testing ${tester.name}`);
  if (!(await tester(contractClient))) {
    console.error(`[FAIL] ${tester.name}`);
  } else {
    console.log(`[SUCCESS] ${tester.name}`);
  }
}

async function executeAllTests(): Promise<Result<void, Error>> {
  return Result.fromAsync(initializeAndUploadContract())
    .onSuccess(async (contractClient) => {
      await runTestFunction(test_buy_in, contractClient);
    })
    .map(() => {});
}

await Result.fromAsync(executeAllTests()).onFailure(console.error);

export type { ContractClient };

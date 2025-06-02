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

interface ContractClient {
  networkClient: SecretNetworkClient;
  instantiateData: InstantiateData;
}

async function initializeAndUploadContract(): Promise<
  Result<ContractClient, Error>
> {
  const [networkClient, wallet] = initialiseNetworkClient(Network.Localnet);

  const faucetResult = await fillUpFromFaucet(networkClient, 100_000_000);
  if (faucetResult.isError()) {
    return faucetResult;
  }

  const wasmPath = "../../contract/optimized-wasm/chain_poker.wasm.gz";
  const gasLimit = 400_000;
  const instantiationMessage = {
    big_blind: 1_000_000n,
    max_buy_in_bb: 100n,
    min_buy_in_bb: 50n,
  };

  return await Result.fromAsyncCatching(fs.promises.readFile(wasmPath))
    .map((contractWasm) =>
      uploadContract(gasLimit, wallet, networkClient, contractWasm),
    )
    .map((uploadData) =>
      instantiateContract(
        instantiationMessage,
        gasLimit,
        uploadData,
        wallet.address,
        networkClient,
      ),
    )
    .map((instantiateData) => ({ networkClient, instantiateData }));
}

function test_gas_limits(): void {
  // There is no accurate way to measue gas limits but it is actually highly recommended
  // to make sure that the gas that is used by a specific tx makes sense
}

function runTestFunction(
  tester: (contractClient: ContractClient) => void,
  contractClient: ContractClient,
): void {
  console.log(`Testing ${tester.name}`);
  tester(contractClient);
  console.log(`[SUCCESS] ${tester.name}`);
}

async function executeAllTests(): Promise<Result<void, Error>> {
  return Result.fromAsync(initializeAndUploadContract())
    .onSuccess((contractClient) => {
      runTestFunction(test_gas_limits, contractClient);
    })
    .onSuccess((contractClient) => {
      runTestFunction(test_gas_limits, contractClient);
    })
    .onSuccess((contractClient) => {
      runTestFunction(test_gas_limits, contractClient);
    })
    .map(() => {});
}

await Result.fromAsync(executeAllTests()).onFailure(console.error);

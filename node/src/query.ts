import dotenv from "dotenv";
import { SecretNetworkClient } from "secretjs";
import { Result } from "typescript-result";

import { initialiseNetworkClient, Network } from "./client";
import { InstantiateData, readInstantiateData } from "./io";

/**
 * Query the specified contract and return the result.
 *
 * @param query - The query to send to the contract, as an object.
 * @param instantiateData - An object containing both contractAddress: the
 *    address of the contract on the network and contractCodeHash: the hash of
 *    the contract's compiled binary Web Assembly, to verify we're querying the
 *    correct contract.
 * @param networkClient - A Secret Network client, initialised with `wallet`.
 *
 * @returns A result containing the query response if successful, otherwiese a
 *    string error message.
 */
async function queryContract(
  query: object,
  instantiateData: InstantiateData,
  networkClient: SecretNetworkClient,
): Promise<Result<object, string>> {
  const queryResponse: object | string =
    await networkClient.query.compute.queryContract({
      contract_address: instantiateData.contractAddress,
      code_hash: instantiateData.contractCodeHash,
      query,
    });

  if (typeof queryResponse === "string") {
    return Result.error(queryResponse);
  }

  return Result.ok(queryResponse);
}

/**
 * Attempt to query the contract with the default query.
 *
 * The default query is whatever query message is specified in the `query`
 * variable of this function.
 *
 * @returns A result of nothing if execution is sucessfull, otherwise a string
 * error message.
 */
async function main(): Promise<Result<void, string>> {
  dotenv.config();

  if (process.env.MNEMONIC === undefined) {
    return Result.error("Wallet mnemonic was not found in environment");
  }
  const [networkClient] = initialiseNetworkClient(Network.Testnet);

  const query = {};

  return await Result.fromAsync(readInstantiateData())
    .map((instantiateData) =>
      queryContract(query, instantiateData, networkClient),
    )
    .map(console.log);
}

await Result.fromAsync(main()).onFailure(console.error);

export default queryContract;

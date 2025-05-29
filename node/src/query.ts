import { SecretNetworkClient } from "secretjs";
import { Result } from "typescript-result";

import Err from "./err";
import { InstantiateData } from "./types";

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
 * @returns A result containing the query response if successful, otherwise
 *    an error.
 */
async function queryContract<ReturnType extends object>(
  query: object,
  instantiateData: InstantiateData,
  networkClient: SecretNetworkClient,
): Promise<Result<ReturnType, Error>> {
  const queryResponse: ReturnType | string =
    await networkClient.query.compute.queryContract({
      contract_address: instantiateData.contractAddress,
      code_hash: instantiateData.contractCodeHash,
      query,
    });

  if (typeof queryResponse === "string") {
    return Err(queryResponse);
  }

  return Result.ok(queryResponse);
}

export default queryContract;

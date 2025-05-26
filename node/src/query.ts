import { SecretNetworkClient } from "secretjs";
import { Result } from "typescript-result";
import instantiateClient from "./client";
import { readInstantiateData } from "./io";

/**
 * Query the specified contract and return the result.
 *
 * @param query - The query to send to the contract, as an object.
 * @param contractAddress - The address of the contract on the network.
 * @param contractCodeHash - The hash of the contract's compiled binary Web
 *    Assembly, to verify we're querying the correct contract.
 * @param networkClient - A Secret Network client, initialised with `wallet`.
 *
 * @returns A result containing the query response if successful, otherwiese a
 *    string error message.
 */
async function queryContract(
  query: object,
  contractAddress: string,
  contractCodeHash: string,
  networkClient: SecretNetworkClient,
): Promise<Result<object, string>> {
  const queryResponse: object | string =
    await networkClient.query.compute.queryContract({
      contract_address: contractAddress,
      code_hash: contractCodeHash,
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
  const clientResult = instantiateClient();
  if (!clientResult.isOk()) return clientResult.map(() => {});
  const [networkClient] = clientResult.value;

  const instantiateDataResult = await Result.fromAsync(readInstantiateData());
  if (!instantiateDataResult.isOk()) return instantiateDataResult.map(() => {});
  const { contractCodeHash, contractAddress } = instantiateDataResult.value;

  const query = {};

  return await Result.fromAsync(
    queryContract(query, contractAddress, contractCodeHash, networkClient),
  ).map(console.log);
}

await Result.fromAsync(main()).mapError(console.error);

export default queryContract;

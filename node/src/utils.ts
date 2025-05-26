import fetch, { Response } from "node-fetch";
import { SecretNetworkClient } from "secretjs";
import { AsyncResult, Result } from "typescript-result";

/**
 * Query the network for the balance of the address associated with the given
 * network client.
 *
 * @param networkClient - A network client initialised with a wallet
 *
 * @returns The balance of the address associated with the given network
 *    client.
 */
async function getScrtBalance(
  networkClient: SecretNetworkClient,
): Promise<Result<number, string>> {
  const balanceResponse = await networkClient.query.bank.balance({
    address: networkClient.address,
    denom: "uscrt",
  });

  if (balanceResponse.balance?.amount === undefined) {
    return Result.error(
      `Failed to get balance for address: ${networkClient.address}`,
    );
  }

  return Result.ok(Number(balanceResponse.balance.amount));
}

/**
 * Turn a Response into a Result which is errror if the response is not ok.
 *
 * @param response - An HTTP(S) response from fetch.
 *
 * @returns A result containing the response if it was successfull, otherwise a string error message.
 */
async function processResponse(
  response: Response,
): Promise<Result<Response, string>> {
  if (!response.ok) {
    return Result.error(
      `${response.status} ${response.statusText}: ${await response.text()}`,
    );
  }
  return Result.ok(response);
}

/**
 * Ask the faucet to give the provided address some tokens.
 *
 * @param address - The Secret Network address to send tokens to.
 *
 * @returns An asyncronous result containing the response from the faucet if
 *    successfull, otherwise a string error message.
 */
function getFromFaucet(address: string): AsyncResult<Response, string> {
  return Result.fromAsyncCatching(
    fetch(`http://localhost:5000/faucet?address=${address}`),
  )
    .mapError(String)
    .map(processResponse);
  // TODO: Add more usefull information: `failed to get tokens from faucet: ${error}`
}

/**
 * Provide the wallet associated with `networkClient` at least `targetBalance`
 * SCRT from the faucet.
 *
 * @param networkClient - A secret network client initialised with a wallet.
 * @param targetBalance - The desired SCRT balance of the associated wallet.
 */
async function fillUpFromFaucet(
  networkClient: SecretNetworkClient,
  targetBalance: number,
): Promise<Result<void, string>> {
  // TODO: implement limit on request attempts, if possible attach any errors
  // to the returned error.
  //
  const balance = await getScrtBalance(networkClient);
  if (!balance.isOk()) return balance.map(() => {});

  while (balance.value < targetBalance) {
    await getFromFaucet(networkClient.address).onFailure(console.error);

    const balance = await getScrtBalance(networkClient);
    if (!balance.isOk()) return balance.map(() => {});
  }

  return Result.ok();
}

export { getFromFaucet, getScrtBalance, fillUpFromFaucet };

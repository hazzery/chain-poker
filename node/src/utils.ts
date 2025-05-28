import fetch, { Response } from "node-fetch";
import { SecretNetworkClient } from "secretjs";
import { AsyncResult, Result } from "typescript-result";

function Err(message: string): Result<never, Error> {
  return Result.error(new Error(message));
}

/**
 * Query the network for the balance of the address associated with the given
 * network client.
 *
 * @param networkClient - A network client initialised with a wallet
 *
 * @returns A result containing the balance of the address associated with the
 *    given network client if successfull, otherwise an error.
 */
async function getScrtBalance(
  networkClient: SecretNetworkClient,
): Promise<Result<number, Error>> {
  const balanceResponse = await networkClient.query.bank.balance({
    address: networkClient.address,
    denom: "uscrt",
  });

  if (balanceResponse.balance?.amount === undefined) {
    return Err(`Failed to get balance for address: ${networkClient.address}`);
  }

  return Result.ok(Number(balanceResponse.balance.amount));
}

/**
 * Turn a Response into a Result which is errror if the response is not ok.
 *
 * @param response - An HTTP(S) response from fetch.
 *
 * @returns A result containing the response if it was successfull, otherwise an error.
 */
async function processResponse(
  response: Response,
): Promise<Result<Response, Error>> {
  if (!response.ok) {
    return Err(
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
 *    successfull, otherwise an error.
 */
function getFromFaucet(address: string): AsyncResult<Response, Error> {
  return Result.fromAsyncCatching(
    fetch(`http://localhost:5000/faucet?address=${address}`),
  ).map(processResponse);
  // TODO: Add more usefull information: `failed to get tokens from faucet: ${error}`
}

/**
 * Provide the wallet associated with `networkClient` at least `targetBalance`
 * SCRT from the faucet.
 *
 * @param networkClient - A secret network client initialised with a wallet.
 * @param targetBalance - The desired SCRT balance of the associated wallet.
 *
 * @returns A result of nothing if successfull, otherwise an Error.
 */
async function fillUpFromFaucet(
  networkClient: SecretNetworkClient,
  targetBalance: number,
): Promise<Result<void, Error>> {
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

export { Err, getFromFaucet, getScrtBalance, fillUpFromFaucet };

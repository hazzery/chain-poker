import {
  SecretNetworkClient,
  TxResponse,
  TxResultCode,
  Wallet,
} from "secretjs";
import { Result } from "typescript-result";
import { initialiseNetworkClient, Network } from "./client";
import { InstantiateData, readInstantiateData } from "./io";

/**
 * Try to execute `message` on the network configured inside of `networkClient`
 *    with the specified gas limit.
 *
 * @param message - The message to send to the contract, as an object.
 * @param gasLimit - The maximum amount of gas (uSCRT) the execution of this
 *    message is allowed to consume before failing.
 * @param instantiateData - An object containing both contractAddress: the
 *    address of the contract on the network and contractCodeHash: the hash
 *    of the contract's compiled binary Web Assembly, to verify we're querying
 *    the correct contract.
 * @param wallet - A wallet initialised with a private key.
 * @param networkClient - A Secret Network client, initialised with `wallet`.
 *
 * @returns A response containing the transaction response.
 */
async function tryExecute(
  message: object,
  gasLimit: number,
  instantiateData: InstantiateData,
  wallet: Wallet,
  networkClient: SecretNetworkClient,
): Promise<Result<TxResponse, string>> {
  const transaction = await networkClient.tx.compute.executeContract(
    {
      sender: wallet.address,
      contract_address: instantiateData.contractAddress,
      msg: message,
      code_hash: instantiateData.contractCodeHash,
    },
    { gasLimit },
  );

  if (transaction.code !== TxResultCode.Success) {
    return Result.error(
      `Failed to execute the transaction: Status code ${TxResultCode[transaction.code]}`,
    );
  }

  return Result.ok(transaction);
}

/**
 * Attempt to have the contract execution the default action.
 *
 * The default action is whatever execute message is specified in the `message`
 * variable of this function.
 *
 * @returns A result of nothing if execution is sucessfull, otherwise a string
 * error message.
 */
async function main(): Promise<Result<void, string>> {
  const [networkClient, wallet] = initialiseNetworkClient(Network.Testnet);

  const message = {};
  const gasLimit = 100_000;

  return await Result.fromAsync(readInstantiateData())
    .map((instantiateData) =>
      tryExecute(message, gasLimit, instantiateData, wallet, networkClient),
    )
    .map(console.log);
}

await Result.fromAsync(main()).onFailure(console.error);

export default tryExecute;

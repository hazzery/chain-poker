import { SecretNetworkClient, TxResponse, Wallet } from "secretjs";
import { Result } from "typescript-result";
import instantiateClient from "./client";
import { readInstantiateData } from "./io";

/**
 * Try to execute `message` on the network configured inside of `networkClient`
 *    with the specified gas limit.
 *
 * @param message - The message to send to the contract, as an object.
 * @param gasLimit - The maximum amount of gas (uSCRT) the execution of this
 *    message is allowed to consume before failing.
 * @param wallet - A wallet initialised with a private key.
 * @param contractAddress - The address of the contract on the network.
 * @param contractCodeHash - The hash of the contract's compiled binary Web
 *    Assembly, to verify we're querying the correct contract.
 * @param networkClient - A Secret Network client, initialised with `wallet`.
 *
 * @returns A response containing the transaction response.
 */
async function tryExecute(
  message: object,
  gasLimit: number,
  wallet: Wallet,
  contractAddress: string,
  contractCodeHash: string,
  networkClient: SecretNetworkClient,
): Promise<Result<TxResponse, string>> {
  const transactionResponse = await networkClient.tx.compute.executeContract(
    {
      sender: wallet.address,
      contract_address: contractAddress,
      msg: message,
      code_hash: contractCodeHash,
    },
    { gasLimit },
  );

  return Result.ok(transactionResponse);
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
  const clientResult = instantiateClient();
  if (!clientResult.isOk()) return clientResult.map(() => {});
  const [networkClient, wallet] = clientResult.value;

  const instantiateDataResult = await Result.fromAsync(readInstantiateData());
  if (!instantiateDataResult.isOk()) return instantiateDataResult.map(() => {});
  const { contractCodeHash, contractAddress } = instantiateDataResult.value;

  const message = {};
  const gasLimit = 100_000;

  return await Result.fromAsync(
    tryExecute(
      message,
      gasLimit,
      wallet,
      contractAddress,
      contractCodeHash,
      networkClient,
    ),
  ).map(console.log);
}

await Result.fromAsync(main()).mapError(console.error);

export default tryExecute;

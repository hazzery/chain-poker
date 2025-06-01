import { SecretNetworkClient, TxResponse } from "secretjs";
import { AsyncResult, Result } from "typescript-result";
import { transactionStatusCheck } from "./transaction";
import { InstantiateData } from "./types";

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
 * @returns A result containing the transaction response if successful,
 *    otherwise an error.
 */
function tryExecute(
  message: object,
  gasLimit: number,
  instantiateData: InstantiateData,
  senderAddress: string,
  networkClient: SecretNetworkClient,
  funds?: bigint,
): AsyncResult<TxResponse, Error> {
  return Result.fromAsyncCatching(
    networkClient.tx.compute.executeContract(
      {
        sender: senderAddress,
        contract_address: instantiateData.contractAddress,
        msg: message,
        code_hash: instantiateData.contractCodeHash,
        sent_funds:
          funds !== undefined
            ? [{ denom: "uscrt", amount: funds.toString() }]
            : undefined,
      },
      { gasLimit },
    ),
  ).map(transactionStatusCheck);
}

export default tryExecute;

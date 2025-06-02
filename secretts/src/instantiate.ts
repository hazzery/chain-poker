import { SecretNetworkClient } from "secretjs";
import { type AsyncResult, Result } from "typescript-result";

import { findInLogs, transactionStatusCheck } from "./transaction.ts";
import type { InstantiateData, UploadData } from "./types.ts";

/**
 * Instantiate the contract at with the given code ID and hash with the provided
 * instantiationation message.
 *
 * @param instantiationMessage - The message to instantiate the contract with.
 * @param gasLimit - The maximum amount of gas (uSCRT) the execution of this
 *    message is allowed to consume before failing.
 * @param uploadData - An object containing both the codeId: the uploaded
 *    contract's unique identifier; and contractCodeHash: the hash of the
 *    contract's compiled binary Web Assembly, to verify we're querying
 *    the correct contract.
 * @param wallet - A wallet initialised with a private key.
 * @param networkClient - A Secret Network client, initialised with `wallet`.
 *
 * @returns A result of an object containing the new address of the
 *    instantiated contract and the hash of the contract's code if successfull,
 *    otherwise an error.
 */
function instantiateContract(
  instantiationMessage: object,
  gasLimit: number,
  uploadData: UploadData,
  walletAddress: string,
  networkClient: SecretNetworkClient,
): AsyncResult<InstantiateData, Error> {
  return Result.fromAsyncCatching(
    networkClient.tx.compute.instantiateContract(
      {
        code_id: uploadData.codeId,
        sender: walletAddress,
        code_hash: uploadData.contractCodeHash,
        init_msg: instantiationMessage,
        label: `Init ${Math.ceil(Math.random() * 10000)}`,
        admin: walletAddress,
      },
      { gasLimit },
    ),
  )
    .map(transactionStatusCheck)
    .map((transactionResponse) =>
      findInLogs(transactionResponse, "contract_address"),
    )
    .map((contractAddress) => ({
      contractCodeHash: uploadData.contractCodeHash,
      contractAddress,
    }));
}

export default instantiateContract;

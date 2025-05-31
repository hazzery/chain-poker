import { SecretNetworkClient } from "secretjs";
import { Result } from "typescript-result";

import { findInLogs, transactionStatusCheck } from "./transaction";
import { InstantiateData, UploadData } from "./types";

interface InstantiationMessage {
  big_blind: bigint;
  min_buy_in_bb: bigint;
  max_buy_in_bb: bigint;
}

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
 * @returns A result containing the new address of the instantiated contract if
 *    successfull, otherwise an error.
 */
async function instantiateContract(
  instantiationMessage: InstantiationMessage,
  gasLimit: number,
  uploadData: UploadData,
  walletAddress: string,
  networkClient: SecretNetworkClient,
): Promise<Result<InstantiateData, Error>> {
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

export { instantiateContract as default, type InstantiationMessage };

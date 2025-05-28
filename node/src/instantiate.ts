import { SecretNetworkClient, TxResultCode, Wallet } from "secretjs";
import { Result } from "typescript-result";

import { InstantiateData, UploadData } from "./io";
import { Err } from "./utils";

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
  instantiationMessage: object,
  gasLimit: number,
  uploadData: UploadData,
  wallet: Wallet,
  networkClient: SecretNetworkClient,
): Promise<Result<InstantiateData, Error>> {
  const transaction = await networkClient.tx.compute.instantiateContract(
    {
      code_id: uploadData.codeId,
      sender: wallet.address,
      code_hash: uploadData.contractCodeHash,
      init_msg: instantiationMessage,
      label: `Init ${Math.ceil(Math.random() * 10000)}`,
      admin: wallet.address,
    },
    { gasLimit },
  );

  if (transaction.code !== TxResultCode.Success) {
    return Err(
      `Failed to instantiate the contract. Status code: ${TxResultCode[transaction.code]}`,
    );
  }

  // Find the contract_address in the logs
  const contractAddress = transaction.arrayLog?.find(
    (log) => log.type === "message" && log.key === "contract_address",
  )?.value;

  if (contractAddress === undefined) {
    return Err("Unable to find contract address");
  }

  return Result.ok({
    contractCodeHash: uploadData.contractCodeHash,
    contractAddress,
  });
}

export default instantiateContract;

import { SecretNetworkClient, TxResultCode, Wallet } from "secretjs";
import { Result } from "typescript-result";

import Err from "./err";
import { UploadData } from "./types";

/**
 * Upload the provided Web Assembly code to the network configured inside of the
 * `networkClient` client.
 *
 * @param gasLimit - The maximum amount of gas (uSCRT) the execution of this
 *    message is allowed to consume before failing.
 * @param wallet - A wallet initialised with a private key.
 * @param networkClient - A Secret Network client, initialised with `wallet`.
 * @param contractWasm - A buffer containing the contract's compiled binary Web
 *    Assembly code
 *
 * @returns A result containing an object with the code ID and the contract
 *    code hash if sucessfull, otherwise an error.
 */
async function uploadContract(
  gasLimit: number,
  wallet: Wallet,
  networkClient: SecretNetworkClient,
  contractWasm: Buffer,
): Promise<Result<UploadData, Error>> {
  const transaction = await networkClient.tx.compute.storeCode(
    {
      sender: wallet.address,
      wasm_byte_code: contractWasm,
      source: "",
      builder: "",
    },
    { gasLimit },
  );

  if (transaction.code !== TxResultCode.Success) {
    return Err(
      `Failed to upload the contract. Status code: ${TxResultCode[transaction.code]}`,
    );
  }

  const codeId = transaction.arrayLog?.find(
    (log) => log.type === "message" && log.key === "code_id",
  )?.value;

  if (codeId === undefined) {
    return Err("Unable to find Code ID");
  }

  const contractCodeHash = (
    await networkClient.query.compute.codeHashByCodeId({ code_id: codeId })
  ).code_hash;

  if (contractCodeHash === undefined) {
    return Err("Unable to compute contract code hash");
  }

  return Result.ok({ codeId, contractCodeHash });
}

export default uploadContract;

import {
  SecretNetworkClient,
  TxResponse,
  TxResultCode,
  Wallet,
} from "secretjs";
import { Result } from "typescript-result";

import Err from "./err";
import { UploadData } from "./types";

/**
 * Process the respopnse from the contract, returning error if correct
 * information cannot be found from the transaction response.
 *
 * @param transaction - The transaction to process.
 * @param networkClient - A Secret Network client.
 *
 * @returns A result containing an object with the code ID and the contract
 *    code hash if sucessfull, otherwise an error.
 */
async function processUploadTransactionResponse(
  transaction: TxResponse,
  networkClient: SecretNetworkClient,
): Promise<Result<UploadData, Error>> {
  if (transaction.code !== TxResultCode.Success) {
    return Err(
      "Failed to upload the contract.\n\n" +
        `Status code: ${TxResultCode[transaction.code]}\n\n` +
        transaction.rawLog,
    );
  }

  const codeId = transaction.arrayLog?.find(
    (log) => log.type === "message" && log.key === "code_id",
  )?.value;

  if (codeId === undefined) {
    return Err("Unable to find Code ID");
  }

  return Result.fromAsyncCatching(
    networkClient.query.compute.codeHashByCodeId({ code_id: codeId }),
  )
    .map((response) => response.code_hash)
    .map((contractCodeHash) => {
      if (contractCodeHash === undefined) {
        return Err("Unable to compute contract code hash");
      }
      return contractCodeHash;
    })
    .map((contractCodeHash) => ({
      codeId,
      contractCodeHash,
    }));
}

/**
 * Upload the provided Web Assembly code to the network configured inside of the
 * `networkClient` client.
 *
 * @param gasLimit - The maximum amount of gas (uSCRT) the execution of this
 *    message is allowed to consume before failing.
 * @param wallet - A wallet initialised with a private key.
 * @param networkClient - A Secret Network client, initialised with `wallet`.
 * @param contractWasm - A buffer containing the contract's compiled binary Web
 *    Assembly code.
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
  return Result.fromAsyncCatching(
    networkClient.tx.compute.storeCode(
      {
        sender: wallet.address,
        wasm_byte_code: contractWasm,
        source: "",
        builder: "",
      },
      { gasLimit },
    ),
  ).map((transaxtion) =>
    processUploadTransactionResponse(transaxtion, networkClient),
  );
}

export default uploadContract;

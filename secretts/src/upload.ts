import { SecretNetworkClient } from "secretjs";
import { Result } from "typescript-result";

import Err from "./err.ts";
import { findInLogs, transactionStatusCheck } from "./transaction.ts";
import type { UploadData } from "./types.ts";

/**
 * Request the hash of the contract's binary Web Assembly.
 *
 * @param codeId - The unique identifier of the contract's upload Web Assembly
 *    code on the network.
 * @param networkClient - A Secret Network client.
 *
 * @returns A result containing an object with the code ID and the contract
 *    code hash if sucessfull, otherwise an error.
 */
async function computeCodeHash(
  codeId: string,
  networkClient: SecretNetworkClient,
): Promise<Result<UploadData, Error>> {
  return await Result.fromAsyncCatching(
    networkClient.query.compute.codeHashByCodeId({ code_id: codeId }),
  ).map((queryResponse) => {
    if (queryResponse.code_hash === undefined) {
      return Err("Unable to compute contract code hash");
    }
    return {
      codeId,
      contractCodeHash: queryResponse.code_hash,
    };
  });
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
  networkClient: SecretNetworkClient,
  contractWasm: Buffer,
): Promise<Result<UploadData, Error>> {
  return await Result.fromAsyncCatching(
    networkClient.tx.compute.storeCode(
      {
        sender: networkClient.address,
        wasm_byte_code: contractWasm,
        source: "",
        builder: "",
      },
      { gasLimit },
    ),
  )
    .map(transactionStatusCheck)
    .map((transactionResponse) => findInLogs(transactionResponse, "code_id"))
    .map((codeId) => computeCodeHash(codeId, networkClient));
}

export default uploadContract;

import * as fs from "fs";
import dotenv from "dotenv";
import { SecretNetworkClient, TxResultCode, Wallet } from "secretjs";
import { Result } from "typescript-result";

import { initialiseNetworkClient, Network } from "./client";
import { UploadData, writeUploadData } from "./io";

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
 *    code hash if sucessfull, otherwise a string error message.
 */
async function uploadContract(
  gasLimit: number,
  wallet: Wallet,
  networkClient: SecretNetworkClient,
  contractWasm: Buffer,
): Promise<Result<UploadData, string>> {
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
    return Result.error(`Failed to upload contract! code: ${transaction.code}`);
  }

  const codeId = transaction.arrayLog?.find(
    (log) => log.type === "message" && log.key === "code_id",
  )?.value;

  if (codeId === undefined) {
    return Result.error("Unable to find Code ID");
  }

  const contractCodeHash = (
    await networkClient.query.compute.codeHashByCodeId({ code_id: codeId })
  ).code_hash;

  if (contractCodeHash === undefined) {
    return Result.error("Unable to compute contract code hash");
  }

  return Result.ok({ codeId, contractCodeHash });
}

/**
 * Upload the compiled contract's binary Web Assembly code to the network.
 *
 * @returns A result of nothing if execution is sucessfull, otherwise a string
 * error message.
 */
async function main(): Promise<Result<void, string>> {
  dotenv.config();

  if (process.env.MNEMONIC === undefined) {
    return Result.error("Wallet mnemonic was not found in environment");
  }

  const [networkClient, wallet] = initialiseNetworkClient(
    Network.Testnet,
    process.env.MNEMONIC,
  );

  const contractWasm = fs.readFileSync("../contract.wasm.gz");
  const gasLimit = 4_000_000;

  return await Result.fromAsync(
    uploadContract(gasLimit, wallet, networkClient, contractWasm),
  ).map(writeUploadData);
}

await Result.fromAsync(main()).mapError(console.error);

export default uploadContract;

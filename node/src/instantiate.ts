import { SecretNetworkClient, Wallet } from "secretjs";
import { Result } from "typescript-result";

import { readUploadData, writeInstantiaionData } from "./io";
import instantiateClient from "./client";

/**
 * Instantiate the contract at with the given code ID and hash with the provided
 * instantiationation message.
 *
 * @param instantiationMessage - The message to instantiate the contract with.
 * @param gasLimit - The maximum amount of gas (uSCRT) the execution of this
 *    message is allowed to consume before failing.
 * @param codeId - The uploaded contract Web Assembly code's unique identifier.
 * @param contractCodeHash - The hash of the contract's compiled binary Web
 *    Assembly, to verify we're querying the correct contract.
 * @param wallet - A wallet initialised with a private key.
 * @param networkClient - A Secret Network client, initialised with `wallet`.
 *
 * @returns A result containing the new address of the instantiated contract if
 *    successfull, otherwise a string error message.
 */
async function instantiateContract(
  instantiationMessage: object,
  gasLimit: number,
  codeId: string,
  contractCodeHash: string,
  wallet: Wallet,
  networkClient: SecretNetworkClient,
): Promise<Result<string, string>> {
  const transaction = await networkClient.tx.compute.instantiateContract(
    {
      code_id: codeId,
      sender: wallet.address,
      code_hash: contractCodeHash,
      init_msg: instantiationMessage,
      label: `Init ${Math.ceil(Math.random() * 10000)}`,
      admin: wallet.address,
    },
    { gasLimit },
  );

  // Find the contract_address in the logs
  const contractAddress = transaction.arrayLog?.find(
    (log) => log.type === "message" && log.key === "contract_address",
  )?.value;

  if (contractAddress === undefined) {
    return Result.error("Unable to find contract address");
  }

  return Result.ok(contractAddress);
}

/**
 * Instantiate the contract.
 *
 * @returns A result of nothing if execution was successfull, otherwise a string
 *    error message.
 */
async function main(): Promise<Result<void, string>> {
  const clientResult = instantiateClient();
  if (!clientResult.isOk()) return clientResult.map(() => {});
  const [networkClient, wallet] = clientResult.value;

  const uploadDataResult = await Result.fromAsync(readUploadData());
  if (!uploadDataResult.isOk()) return uploadDataResult.map(() => {});
  const { codeId, contractCodeHash } = uploadDataResult.value;

  const instantiationMessage = {
    big_blind: 1_000_000,
    max_buy_in_bb: 100,
    min_buy_in_bb: 50,
  };
  const gasLimit = 400_000;

  return await Result.fromAsync(
    instantiateContract(
      instantiationMessage,
      gasLimit,
      codeId,
      contractCodeHash,
      wallet,
      networkClient,
    ),
  ).map((contractAddress) =>
    writeInstantiaionData(contractCodeHash, contractAddress),
  );
}

await Result.fromAsync(main()).mapError(console.error);

export default instantiateContract;

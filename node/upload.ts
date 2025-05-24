import { SecretNetworkClient, Wallet } from "secretjs";
import * as fs from "fs";
import dotenv from "dotenv";
import { Result } from "typescript-result";

async function uploadContract(
  wallet: Wallet,
  secretjs: SecretNetworkClient,
  contractWasm: Buffer,
): Promise<Result<[string, string], string>> {
  console.log("Starting deployment…");

  let tx = await secretjs.tx.compute.storeCode(
    {
      sender: wallet.address,
      wasm_byte_code: contractWasm,
      source: "",
      builder: "",
    },
    {
      gasLimit: 4_000_000,
    },
  );

  const codeId: string | undefined = tx.arrayLog?.find(
    (log) => log.type === "message" && log.key === "code_id",
  )?.value;

  if (codeId === undefined) {
    return Result.error("Unable to find Code ID");
  }

  const contractCodeHash: string | undefined = (
    await secretjs.query.compute.codeHashByCodeId({ code_id: codeId })
  ).code_hash;

  if (contractCodeHash === undefined) {
    return Result.error("Unable to compute contract code hash");
  }

  return Result.ok([codeId, contractCodeHash]);
}

async function instantiateContract(
  codeId: string,
  contractCodeHash: string,
  wallet: Wallet,
  secretjs: SecretNetworkClient,
): Promise<Result<string, string>> {
  console.log("Instantiating contract…");

  let tx = await secretjs.tx.compute.instantiateContract(
    {
      code_id: codeId,
      sender: wallet.address,
      code_hash: contractCodeHash,
      init_msg: {},
      label: "example " + Math.ceil(Math.random() * 10000),
      admin: wallet.address,
    },
    {
      gasLimit: 400_000,
    },
  );

  // Find the contract_address in the logs
  const contractAddress = tx.arrayLog?.find(
    (log) => log.type === "message" && log.key === "contract_address",
  )?.value;

  if (contractAddress === undefined) {
    return Result.error("Unable to find contract address");
  }

  return Result.ok(contractAddress);
}

async function main(): Promise<void> {
  dotenv.config();

  const wallet = new Wallet(process.env.MNEMONIC);

  const contractWasm = fs.readFileSync("../contract.wasm.gz");

  const secretjs = new SecretNetworkClient({
    chainId: "pulsar-3",
    url: "https://pulsar.lcd.secretnodes.com",
    wallet: wallet,
    walletAddress: wallet.address,
  });

  const contractAddress = await Result.fromAsync(
    uploadContract(wallet, secretjs, contractWasm),
  ).map((codeIdAndHash) =>
    instantiateContract(...codeIdAndHash, wallet, secretjs),
  );

  if (contractAddress.isError()) {
    console.error(contractAddress.error);
    return;
  }

  console.log(contractAddress.value);
}

await main();

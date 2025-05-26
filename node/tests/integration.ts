import fs from "fs";
import fetch from "node-fetch";
import { SecretNetworkClient, TxResultCode, Wallet } from "secretjs";

// Returns a client with which we can interact with secret network
function initializeClient(
  endpoint: string,
  chainId: string,
): SecretNetworkClient {
  const wallet = new Wallet(); // Use default constructor of wallet to generate random mnemonic.
  const accAddress = wallet.address;
  const client = new SecretNetworkClient({
    // Create a client to interact with the network
    url: endpoint,
    chainId: chainId,
    wallet: wallet,
    walletAddress: accAddress,
  });

  console.log(`Initialized client with wallet address: ${accAddress}`);
  return client;
}

// Stores and instantiaties a new contract in our network
async function initializeContract(
  client: SecretNetworkClient,
  contractPath: string,
): Promise<[string, string]> {
  const wasmCode = fs.readFileSync(contractPath);
  console.log("Uploading contract");

  const uploadReceipt = await client.tx.compute.storeCode(
    {
      wasm_byte_code: wasmCode,
      sender: client.address,
      source: "",
      builder: "",
    },
    {
      gasLimit: 5000000,
    },
  );

  if (uploadReceipt.code !== TxResultCode.Success) {
    console.log(
      `Failed to get code id: ${JSON.stringify(uploadReceipt.rawLog)}`,
    );
    throw new Error("Failed to upload contract");
  }

  if (uploadReceipt.jsonLog === undefined) {
    throw new Error("Upload receipt JSON log was not present");
  }

  const codeIdKv = uploadReceipt.jsonLog[0].events[0].attributes.find(
    (a) => a.key === "code_id",
  );

  if (codeIdKv === undefined) {
    throw new Error("Failed to find code_id");
  }

  const codeId = Number(codeIdKv.value);
  console.log("Contract codeId: ", codeId);

  const contractCodeHash = (
    await client.query.compute.codeHashByCodeId({ code_id: String(codeId) })
  ).code_hash;

  if (contractCodeHash === undefined) {
    throw new Error("Failed to get code hash");
  }

  console.log(`Contract hash: ${contractCodeHash}`);

  const contract = await client.tx.compute.instantiateContract(
    {
      sender: client.address,
      code_id: codeId,
      init_msg: {
        big_blind: 100_000, // 0.1 SCRT big blind
        max_buy_in_bb: 100, // 10 SCRT max buy in
        min_buy_in_bb: 50, // 5 SCRT min buy in
      }, // This message will trigger our Init function
      code_hash: contractCodeHash,
      // The label should be unique for every contract, add random string in order to maintain uniqueness
      label: `My contract  ${Math.ceil(Math.random() * 10000)}`,
    },
    {
      gasLimit: 1000000,
    },
  );

  if (contract.code !== TxResultCode.Success) {
    throw new Error(
      `Failed to instantiate the contract with the following error ${contract.rawLog}`,
    );
  }

  const contractAddress = contract.arrayLog?.find(
    (log) => log.type === "message" && log.key === "contract_address",
  )?.value;

  if (contractAddress === undefined) {
    throw new Error("Failed to find contract address");
  }

  console.log(`Contract address: ${contractAddress}`);

  const contractInfo: [string, string] = [contractCodeHash, contractAddress];
  return contractInfo;
}

async function getFromFaucet(address: string): Promise<void> {
  await fetch(`http://localhost:5000/faucet?address=${address}`);
}

async function getScrtBalance(userCli: SecretNetworkClient): Promise<string> {
  const balanceResponse = await userCli.query.bank.balance({
    address: userCli.address,
    denom: "uscrt",
  });

  if (balanceResponse.balance?.amount === undefined) {
    throw new Error(`Failed to get balance for address: ${userCli.address}`);
  }

  return balanceResponse.balance.amount;
}

async function fillUpFromFaucet(
  client: SecretNetworkClient,
  targetBalance: number,
): Promise<void> {
  let balance = await getScrtBalance(client);
  while (Number(balance) < targetBalance) {
    try {
      await getFromFaucet(client.address);
    } catch (error) {
      console.error(`failed to get tokens from faucet: ${error}`);
    }
    balance = await getScrtBalance(client);
  }
  console.error(`got tokens from faucet: ${balance}`);
}

// Initialization procedure
async function initializeAndUploadContract(): Promise<
  [SecretNetworkClient, string, string]
> {
  const endpoint = "http://localhost:1317";
  const chainId = "secretdev-1";

  const client = initializeClient(endpoint, chainId);

  await fillUpFromFaucet(client, 100_000_000);

  const [contractHash, contractAddress] = await initializeContract(
    client,
    "contract.wasm",
  );

  return [client, contractHash, contractAddress];
}

function test_gas_limits(): void {
  // There is no accurate way to measue gas limits but it is actually highly recommended
  // to make sure that the gas that is used by a specific tx makes sense
}

function runTestFunction(
  tester: (
    client: SecretNetworkClient,
    contractHash: string,
    contractAddress: string,
  ) => void,
  client: SecretNetworkClient,
  contractHash: string,
  contractAddress: string,
) {
  console.log(`Testing ${tester.name}`);
  tester(client, contractHash, contractAddress);
  console.log(`[SUCCESS] ${tester.name}`);
}

async function executeAllTests(): Promise<void> {
  const [client, contractHash, contractAddress] =
    await initializeAndUploadContract();

  runTestFunction(test_gas_limits, client, contractHash, contractAddress);
}

await executeAllTests();

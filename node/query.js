import { SecretNetworkClient, Wallet } from "secretjs";

const wallet = new Wallet(process.env.MNEMONIC);

const secretjs = new SecretNetworkClient({
  chainId: "pulsar-3",
  url: "https://pulsar.lcd.secretnodes.com",
  wallet: wallet,
  walletAddress: wallet.address,
});

let contractCodeHash =
  "33ca320501c4cb7fb744fafc8ce8700d8fdbac260b46af68412da59df39b6866";
let contractAddress = "secret1zldfjv88d9sl4rlyfl0kuujyheawwfe6a65d7n";

async function query_contract() {
  let my_query = await secretjs.query.compute.queryContract({
    contract_address: contractAddress,
    code_hash: contractCodeHash,
    query: {},
  });
  console.log("response: ", my_query);
}

query_contract();

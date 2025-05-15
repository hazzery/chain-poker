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

async function try_execute() {
  const tx = await secretjs.tx.compute.executeContract(
    {
      sender: wallet.address,
      contract_address: contractAddress,
      msg: {},
      code_hash: contractCodeHash,
    },
    { gasLimit: 100_000 },
  );

  console.log(tx);
}
try_execute();

# Chain Poker

Chain Poker is a decentralised application (dApp) powered by the Secret
Network. Currently, the project consists of four subdirectories, these are as
follows:

- `/contract` - A Rust crate containing Chain Poker's CosmWasm smart contract.
- `/frontend` - A Preact web application for Chain Poker's user-friendly web
  interface.
- `/node` - A set of scripts used for Chain Poker's development, provides
  functionality such as uploading the contract to the network, instantiating the
  contract, etc.
- `/secretts` - A wrapper library around `secretjs` which provides more type
  safety around errors. Preventing the need to throw and catch errors by using
  the `typescript-result` npm package. This is used in both the Node.js scripts
  and the web application.

## Building the smart contract

To build Chain Poker's contract execute the following command in the top level
directory:

```bash
make build-docker
```

This will spin up a docker container to compile the Rust crate into Web
Assembly. The image will optimse the output binary using `wasm-opt`, compress
it into a gzip file (so the file upload costs less gas), placing the final
output in the `/contract/optimized-wasm/` directory.

## Uploading the contract to the network

Once the contract has been compiled, we can upload the gzipped Web Assembly to
the Secret Network using the Node.js scripts. The network needs a wallet
address that it can charge the gas fees to. To tell the upload script the
address that should be used, create an environment variable file in the top of
the `/node` directory named exactly `.env`. Paste your wallet's private key
inside this file with the name shown below.

```bash
MNEMONIC=  # Enter your wallet's mnemonic here
```

Once your environment variables are set, we can execute the following inside
the `/node` directory:

```bash
npm i
npx tsx upload.ts
```

This will write the new contract code ID and code hash to a JSON file in
`/node/output`, named with a timestamp to differentiate uploads.

> **_NOTE:_** There is currently a bug (I believe in the `typescript-result`
> package) which causes the wrapper result of the data to be written, rather
> than just the data itself. If you need to run further scripts using this code
> ID and hash, you must manually edit the output JSON file, removing the outer
> object, leaving just a single object with `contractCodeHash` and `codeId` as
> its properties.

## Starting the front-end

With the contract built and uploaded to the contract, we are almost ready to
run the web app! To do this, we first need to create a file to store some
environment variables. At the top of the `/frontend` directory, create a file
named exactly `.env`. Copy and paste the following variable definitions and
paste in the values for the contract code hash and code ID that were written to
the JSON file in the previous step.

```bash
VITE_SECRET_CHAIN_ID=pulsar-3
VITE_SECRET_LCD=https://pulsar.lcd.secretnodes.com
VITE_CONTRACT_CODE_HASH=
VITE_CONTRACT_CODE_ID=
```

We can now install the necessary npm packages, and boot up the development
server.

```bash
npm i
npm run dev
```

Open a web browser to `http://localhost:5173` (press `o` and then `Enter`) and
you're away!

## Keplr Wallet

To use Chain Poker's front-end, you must have the Keplr Wallet Browser extension
installed. This is available on the [Firefox add-ons
store](https://addons.mozilla.org/en-US/firefox/addon/keplr/) and the [Chrome
web store](https://chromewebstore.google.com/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap)

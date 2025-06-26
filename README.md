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

## Setting up the development environment

For the Node.js scripts in the `/node` directory and the Preact front-end to
work, we need to install the npm dependencies. The project make file will
prepare this all for you with a single command

```bash
make init
```

When we go to upload the compiled contract, we need to provide the network with
a wallet address that it can charge the gas fees to. To tell the upload script
the address that should be used, create an environment variable file in the top
of the `/node` directory named exactly `.env`. Paste your wallet's private key
inside this file with the name shown below.

```bash
MNEMONIC=  # Enter your wallet's mnemonic here
```

## Building the smart contract

With the set-up all done, we are now able to build and upload the Chain Poker
contract. Execute the following command in the top level directory:

```bash
make
```

This will spin up a docker container to compile the Rust crate into Web
Assembly. The image will optimise the output binary using `wasm-opt`, compress
it into a gzip file (so the file upload costs less gas), placing the final
output in the `/contract/optimized-wasm/` directory.

Once the contract has been compiled, the gzipped Web Assembly is automatically
uploaded to the Secret Network using the Node.js upload script. This will write
the new contract code ID and code hash to both a JSON file in `/node/output`
and to the front-end's `.env` file so it knows which uploaded code instance to
talk to.

## Starting the front-end

With the contract built and uploaded to the network, we are ready to run the
web app! To boot up the development server, execute the following inside the
`/frontend` directory.

```bash
npm run dev
```

Open a web browser to `http://localhost:5173` (press `o` and then `Enter` in
the terminal) and you're away!

> **_Note:_** The build/upload script also instantiates the contract, creating
> a lobby with some predefined lobby configuration. The script will have
> printed the address of this instantiation to the terminal. Copy and paste
> this into the "Join Existing Lobby" form in the front-end to jump straight
> into a game

## Keplr Wallet

To use Chain Poker's front-end, you must have the Keplr Wallet Browser extension
installed. This is available on the
[Firefox add-ons store](https://addons.mozilla.org/en-US/firefox/addon/keplr/) and
the [Chrome web store](https://chromewebstore.google.com/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap)

## Usage

In the front-end, you are initially shown a page with a single "Connect Wallet"
button, pressing this will open up a Keplr Wallet window, requesting your
permission to grant Chain Poker Access to your Secret Network wallet.

Once you accept, this prompt, you are shown two options, creating a new lobby,
and joining an existing one. As we have just uploaded this contract, there will
be no existing lobbies, so press "Create Lobby". Here you will be presented
with a form allowing you to enter all the necessary information to create a new
poker lobby. Once you have correctly filled out all four fields, the "Create"
button will become enabled. Pressing the button will open Keplr Wallet,
allowing you to approve the contract instantiation message, showing you the
transaction's maximum gas fee. Wait patiently while the transaction is
processed by the blockchain.

If the lobby creation is successful, you will be redirected to the lobby page
where you can see all the lobby configuration, as well as the option to buy in
to the game. Again, correctly filling out the form will enable the "Buy In"
button, which when clicked will open Keplr Wallet, so you can approve the buy in
transaction. As the user who created the lobby, you are the only person who can
see the "Start Game" button, which will become enabled as soon as two people
have joined the lobby. Share the lobby code shown on your screen with your
friends, so they can join in too.

When everyone has bought in and the game has started, everyone is redirected to
the game page, which will open a Keplr Wallet window to ask for permission to
create a query permit signed with your private key. Once you have accepted the
creation of a permit, the game page will be populated with information
depicting the state of the game. The green rectangle in the centre of the
screen will eventually display the community cards. The boxes which circle
around the centre show the usernames and balances of all connected users. At
the bottom of the screen you can see your current chip balance, your hand, and
when it is your turn, the option to place a bet. The text input for placing a
bet will not let your bet be smaller than the minimum allowed bet at the
current moment of the game unless you want to fold, in which case you should
place a bet of 0 SCRT.

The game continues around allowing each player to place a bet. When all bets
have been placed, the flop will be revealed, starting off the next round of
betting. Once the final betting round has finished, the contract will calculate
who of the players that did not fold has the strongest hand, and give them the
value in the pot. In the case multiple players have equally strong hands, the
pot will be split as evenly as possible. The contract will also automatically
deal out new cards to all players.

When you wish to withdraw from the game and cash out all winnings back to your
wallet, you may click the "Cash Out" button in the lower left-hand corner of
the screen. Please only click this button at the start of a new hand before you
have placed any bets, or after folding. The withdrawal will fail if you request
it at an invalid time. This prevents any disruption to bets already placed on
the current hand. You know the cash-out was successful If you are redirected to
Chain Poker's home page.

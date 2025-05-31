import type { Permit, TxResponse } from "secretjs";
import { type AsyncResult, Result } from "typescript-result";

import contractExecute from "../../../node/src/execute";
import contractInstantiate, {
  type InstantiationMessage,
} from "../../../node/src/instantiate";
import contractQuery from "../../../node/src/query";
import type { SecretNetworkState } from "./secretNetworkState";

const SECRET_CHAIN_ID = import.meta.env.VITE_SECRET_CHAIN_ID;
const CONTRACT_CODE_HASH = import.meta.env.VITE_CONTRACT_CODE_HASH;
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDR;
const CONTRACT_CODE_ID = import.meta.env.VITE_CONTRACT_CODE_ID;

/**
 * Create a new game lobby.
 *
 * @param gameConfig The game configuration message to instantiate the contract
 *    with.
 * @param networkState - An object which contains the user's wallet address and
 *    the network client.
 *
 * @returns A result of the new lobby's join code if successful, otherwise an error.
 */
function createLobby(
  gameConfig: InstantiationMessage,
  networkState: SecretNetworkState,
): AsyncResult<string, Error> {
  return contractInstantiate(
    gameConfig,
    40_000,
    { codeId: CONTRACT_CODE_ID, contractCodeHash: CONTRACT_CODE_HASH },
    networkState.walletAddress,
    networkState.networkClient,
  ).map((instantiateData) => instantiateData.contractAddress);
}

/**
 * Buy in to the game of poker hosted on the connected contract.
 *
 * @param buyInAmount - The number of uSCRT the player wants to start with.
 * @param networkState - An object which contains the user's wallet address and
 *    the network client.
 *
 * @returns A result of the transaction response from the contract if
 *    successful, otherwise and error.
 */
function buyIn(
  buyInAmount: bigint,
  networkState: SecretNetworkState,
): AsyncResult<TxResponse, Error> {
  return contractExecute(
    { buy_in: {} },
    50_000,
    { contractAddress: CONTRACT_ADDRESS, contractCodeHash: CONTRACT_CODE_HASH },
    networkState.walletAddress,
    networkState.networkClient,
    buyInAmount,
  );
}

/**
 * Start the game of poker hosted on the connected contract.
 *
 * @param networkState - An object which contains the user's wallet address and
 *    the network client.
 *
 * @returns Result containing the transaction result from the contract if
 *    successful, otherwise an Error.
 */
function startGame(
  networkState: SecretNetworkState,
): AsyncResult<TxResponse, Error> {
  return contractExecute(
    { start_game: {} },
    40_000,
    { contractAddress: CONTRACT_ADDRESS, contractCodeHash: CONTRACT_CODE_HASH },
    networkState.walletAddress,
    networkState.networkClient,
  );
}

/**
 * Place a bet on the current hand.
 *
 * @param amount - The number of uSCRT to bet, 0 for check/fold.
 * @param networkState - An object which contains the user's wallet address and
 *    the network client.
 *
 * @returns A result containing the transaction result from the contract if
 *    successful, otherwise an error.
 */
function placeBet(
  amount: bigint,
  networkState: SecretNetworkState,
): AsyncResult<TxResponse, Error> {
  return contractExecute(
    { place_bet: { value: amount } },
    40_000,
    { contractAddress: CONTRACT_ADDRESS, contractCodeHash: CONTRACT_CODE_HASH },
    networkState.walletAddress,
    networkState.networkClient,
  );
}

/**
 * View the state of the table (the publicly known cards).
 *
 * @param networkState - An object which contains the user's wallet address and
 *    the network client.
 *
 * @returns A result containing an object representation of the contract's
 *    response if successful, otherwise an error.
 */
async function viewTable(
  networkState: SecretNetworkState,
): Promise<Result<object, Error>> {
  return contractQuery(
    { view_table: {} },
    { contractAddress: CONTRACT_ADDRESS, contractCodeHash: CONTRACT_CODE_HASH },
    networkState.networkClient,
  );
}

/**
 * View the player's hand and chip balance.
 *
 * @param networkState - An object which contains the user's wallet address and
 *    the network client.
 *
 * @returns A result containing an object representation of the contract's
 *    respose if successful, otherise an error.
 */
async function viewPlayer(
  networkState: SecretNetworkState,
): Promise<Result<object, Error>> {
  return Result.fromAsync(getPermit(networkState)).map((permit) =>
    contractQuery(
      { view_player: { permit } },
      {
        contractAddress: CONTRACT_ADDRESS,
        contractCodeHash: CONTRACT_CODE_HASH,
      },
      networkState.networkClient,
    ),
  );
}

/**
 * Get a permit to perform authenticated queries.
 *
 * Attempts to fetch cached permit from local storage before signing a new
 * permit.
 *
 * @param networkState - An object which contains the user's wallet address and
 *    the network client.
 *
 * @returns A result containing a permit if successful, otherwise an error.
 */
function getPermit(
  networkState: SecretNetworkState,
): AsyncResult<Permit, Error> {
  const storageKey = `${networkState.walletAddress}:${CONTRACT_ADDRESS}:queryPermit}`;
  const queryPermitStored = localStorage.getItem(storageKey);

  if (queryPermitStored) {
    return Result.try(JSON.parse(queryPermitStored));
  }

  return Result.fromAsyncCatching(
    networkState.networkClient.utils.accessControl.permit.sign(
      networkState.walletAddress,
      SECRET_CHAIN_ID,
      "Chain Poker game query permit",
      [CONTRACT_ADDRESS],
      ["owner"],
      true,
    ),
  ).onSuccess((permit) =>
    localStorage.setItem(storageKey, JSON.stringify(permit)),
  );
}

export { buyIn, createLobby, placeBet, startGame, viewPlayer, viewTable };

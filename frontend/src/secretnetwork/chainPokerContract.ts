import type { Permit, SecretNetworkClient, TxResponse } from "secretjs";
import * as secretts from "secretts";
import { type AsyncResult, Result } from "typescript-result";

import type { GameState, PreStartState } from "./types";

const SECRET_CHAIN_ID = import.meta.env.VITE_SECRET_CHAIN_ID;
const CONTRACT_CODE_HASH = import.meta.env.VITE_CONTRACT_CODE_HASH;
const CONTRACT_CODE_ID = import.meta.env.VITE_CONTRACT_CODE_ID;

/**
 * Create a new game lobby.
 *
 * @param username - Name for the current player to be shown to other players.
 * @param bigBlind - The big blind amount for the game.
 * @param min_buy_in_bb - The minimum buy in amount as a multiple of the big
 *    blind amount.
 * @param max_buy_in_bb - The maximum buy in amount as a multiple of the big
 *    blind amount.
 * @param networkClient - A Secret Network client initialised with Keplr.
 *
 * @returns A result of the new lobby's join code if successful, otherwise an
 *    error.
 */
function createLobby(
  username: string,
  bigBlind: bigint,
  min_buy_in_bb: number,
  max_buy_in_bb: number,
  networkClient: SecretNetworkClient,
): AsyncResult<string, Error> {
  const big_blind = Number(bigBlind);
  return secretts
    .instantiateContract(
      { username, big_blind, max_buy_in_bb, min_buy_in_bb },
      400_000,
      { codeId: CONTRACT_CODE_ID, contractCodeHash: CONTRACT_CODE_HASH },
      networkClient,
    )
    .map((instantiateData) => instantiateData.contractAddress);
}

/**
 * Buy in to the game of poker hosted on the connected contract.
 *
 * @param username - Name for the current player to be shown to other players.
 * @param buyInAmount - The number of uSCRT the player wants to start with.
 * @param lobbyCode - The address of the instantiated contract.
 * @param networkClient - A Secret Network client initialised with Keplr.
 *
 * @returns A result of the transaction response from the contract if
 *    successful, otherwise and error.
 */
function buyIn(
  username: string,
  buyInAmount: bigint,
  lobbyCode: string,
  networkClient: SecretNetworkClient,
): AsyncResult<TxResponse, Error> {
  return secretts.tryExecute(
    { buy_in: { username } },
    500_000,
    { contractAddress: lobbyCode, contractCodeHash: CONTRACT_CODE_HASH },
    networkClient,
    buyInAmount,
  );
}

/**
 * Start the game of poker hosted on the connected contract.
 *
 * @param lobbyCode - The address of the instantiated contract.
 * @param networkClient - A Secret Network client initialised with Keplr.
 *
 * @returns Result containing the transaction result from the contract if
 *    successful, otherwise an Error.
 */
function startGame(
  lobbyCode: string,
  networkClient: SecretNetworkClient,
): AsyncResult<TxResponse, Error> {
  return secretts.tryExecute(
    { start_game: {} },
    400_000,
    { contractAddress: lobbyCode, contractCodeHash: CONTRACT_CODE_HASH },
    networkClient,
  );
}

/**
 * Raising increases the minimum bet required for other players to remain in
 * the current hand.
 *
 * @param amount - The number of uSCRT to raise the bet by.
 * @param lobbyCode - The address of the instantiated contract.
 * @param networkClient - A Secret Network client initialised with Keplr.
 *
 * @returns A result containing the transaction result from the contract if
 *    successful, otherwise an error.
 */
function raise(
  amount: bigint,
  lobbyCode: string,
  networkClient: SecretNetworkClient,
): AsyncResult<TxResponse, Error> {
  return secretts.tryExecute(
    { raise: { raise_amount: amount.toString() } },
    50_000,
    { contractAddress: lobbyCode, contractCodeHash: CONTRACT_CODE_HASH },
    networkClient,
  );
}

/**
 * Calling places the minimum allowed bet into the pot, keeping the player's
 * hand for further betting.
 *
 * @param lobbyCode - The address of the instantiated contract.
 * @param networkClient - A Secret Network client initialised with Keplr.
 *
 * @returns A result containing the transaction result from the contract if
 *    successful, otherwise an error.
 */
function call(
  lobbyCode: string,
  networkClient: SecretNetworkClient,
): AsyncResult<TxResponse, Error> {
  return secretts.tryExecute(
    { call: {} },
    50_000,
    {
      contractAddress: lobbyCode,
      contractCodeHash: CONTRACT_CODE_HASH,
    },
    networkClient,
  );
}

/**
 * Checking keeps the player in the game without placing any additional chips
 * into the pot. Can only be performed if all previous players also checked
 * this betting round.
 *
 * @param lobbyCode - The address of the instantiated contract.
 * @param networkClient - A Secret Network client initialised with Keplr.
 *
 * @returns A result containing the transaction result from the contract if
 *    successful, otherwise an error.
 */
function check(
  lobbyCode: string,
  networkClient: SecretNetworkClient,
): AsyncResult<TxResponse, Error> {
  return secretts.tryExecute(
    { check: {} },
    50_000,
    {
      contractAddress: lobbyCode,
      contractCodeHash: CONTRACT_CODE_HASH,
    },
    networkClient,
  );
}

/**
 * Folding removes the user's hand from game, leaving them unable to place any
 * further bets until the next hand is drawn.
 *
 * @param lobbyCode - The address of the instantiated contract.
 * @param networkClient - A Secret Network client initialised with Keplr.
 *
 * @returns A result containing the transaction result from the contract if
 *    successful, otherwise an error.
 */
function fold(
  lobbyCode: string,
  networkClient: SecretNetworkClient,
): AsyncResult<TxResponse, Error> {
  return secretts.tryExecute(
    { fold: {} },
    50_000,
    {
      contractAddress: lobbyCode,
      contractCodeHash: CONTRACT_CODE_HASH,
    },
    networkClient,
  );
}

/**
 * Withdraw from the gamw, cashing out all available balance.
 *
 * @param lobbyCode - The address of the instantiated contract.
 * @param networkClient - A Secret Network client initialised with Keplr.
 *
 * @returns A result containing the transaction result from the contract if
 *    successful, otherwise an error.
 */
async function withdraw(lobbyCode: string, networkClient: SecretNetworkClient) {
  return await secretts.tryExecute(
    { withdraw: {} },
    50_000,
    {
      contractAddress: lobbyCode,
      contractCodeHash: CONTRACT_CODE_HASH,
    },
    networkClient,
  );
}

/**
 * Query the contract for the variable state of a game.
 *
 * @param lobbyCode - The address of the instantiated contract.
 * @param networkClient - A Secret Network client initialised with Keplr.
 *
 * @returns A result containing an object with the variable state of a game if
 *    successful, otherwise an error.
 */
async function viewGameState(
  lobbyCode: string,
  networkClient: SecretNetworkClient,
): Promise<Result<GameState, Error>> {
  return await Result.fromAsync(getPermit(lobbyCode, networkClient)).map(
    (permit) =>
      secretts.queryContract<GameState>(
        { view_game_state: { permit } },
        { contractAddress: lobbyCode, contractCodeHash: CONTRACT_CODE_HASH },
        networkClient,
      ),
  );
}

/**
 * Query the contract for the pre-start state of a lobby.
 *
 * @param lobbyCode - The address of the instantiated contract.
 * @param networkClient - A Secret Network client initialised with Keplr.
 *
 * @returns A result containing an object with the pre-start state of the
 *    lobby if successful, otherwise and error.
 */
async function viewPreStartState(
  lobbyCode: string,
  networkClient: SecretNetworkClient,
): Promise<Result<PreStartState, Error>> {
  return await secretts.queryContract<PreStartState>(
    { view_pre_start_state: {} },
    { contractAddress: lobbyCode, contractCodeHash: CONTRACT_CODE_HASH },
    networkClient,
  );
}

/**
 * Get a permit to perform authenticated queries.
 *
 * Attempts to fetch cached permit from local storage before signing a new
 * permit.
 *
 * @param contractAddress - The address of the instantiated contract.
 * @param networkClient - A Secret Network client initialised with Keplr.
 *
 * @returns A result containing a permit if successful, otherwise an error.
 */
async function getPermit(
  contractAddress: string,
  networkClient: SecretNetworkClient,
): Promise<Result<Permit, Error>> {
  const storageKey = `${networkClient.address}:${contractAddress}:queryPermit}`;
  const queryPermitStored = localStorage.getItem(storageKey);

  if (queryPermitStored) {
    return Result.try(() => JSON.parse(queryPermitStored));
  }

  return (
    await secretts.signPermit(
      contractAddress,
      SECRET_CHAIN_ID,
      networkClient,
      true,
    )
  ).onSuccess((permit) =>
    localStorage.setItem(storageKey, JSON.stringify(permit)),
  );
}

export {
  buyIn,
  call,
  check,
  createLobby,
  fold,
  raise,
  startGame,
  viewGameState,
  viewPreStartState,
  withdraw,
};

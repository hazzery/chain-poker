import type { Permit, SecretNetworkClient, TxResponse } from "secretjs";
import * as secretts from "secretts";
import { type AsyncResult, Result } from "typescript-result";

import type { LobbyConfig, PlayerInfo } from "./types";

const SECRET_CHAIN_ID = import.meta.env.VITE_SECRET_CHAIN_ID;
const CONTRACT_CODE_HASH = import.meta.env.VITE_CONTRACT_CODE_HASH;
const CONTRACT_CODE_ID = import.meta.env.VITE_CONTRACT_CODE_ID;

/**
 * Create a new game lobby.
 *
 * @param gameConfig The game configuration message to instantiate the contract
 *    with.
 * @param networkClient - A Secret Network client initialised with Keplr.
 *
 * @returns A result of the new lobby's join code if successful, otherwise an error.
 */
function createLobby(
  gameConfig: LobbyConfig,
  networkClient: SecretNetworkClient,
): AsyncResult<string, Error> {
  return secretts
    .instantiateContract(
      gameConfig,
      400_000,
      { codeId: CONTRACT_CODE_ID, contractCodeHash: CONTRACT_CODE_HASH },
      networkClient,
    )
    .map((instantiateData) => instantiateData.contractAddress);
}

/**
 * Buy in to the game of poker hosted on the connected contract.
 *
 * @param buyInAmount - The number of uSCRT the player wants to start with.
 * @param lobbyCode - The address of the instantiated contract.
 * @param networkClient - A Secret Network client initialised with Keplr.
 *
 * @returns A result of the transaction response from the contract if
 *    successful, otherwise and error.
 */
function buyIn(
  buyInAmount: number,
  lobbyCode: string,
  networkClient: SecretNetworkClient,
): AsyncResult<TxResponse, Error> {
  return secretts.tryExecute(
    { buy_in: {} },
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
    40_000,
    { contractAddress: lobbyCode, contractCodeHash: CONTRACT_CODE_HASH },
    networkClient,
  );
}

/**
 * Place a bet on the current hand.
 *
 * @param amount - The number of uSCRT to bet, 0 for check/fold.
 * @param lobbyCode - The address of the instantiated contract.
 * @param networkClient - A Secret Network client initialised with Keplr.
 *
 * @returns A result containing the transaction result from the contract if
 *    successful, otherwise an error.
 */
function placeBet(
  amount: number,
  lobbyCode: string,
  networkClient: SecretNetworkClient,
): AsyncResult<TxResponse, Error> {
  const uScrt = String(amount * 1_000_000);
  if (uScrt.split(".").length > 1) {
    return secretts.AsyncErr(
      "amount value too precise. At most 6 places after the decimal point are allowed",
    );
  }
  return secretts.tryExecute(
    { place_bet: { value: amount } },
    40_000,
    { contractAddress: lobbyCode, contractCodeHash: CONTRACT_CODE_HASH },
    networkClient,
  );
}

/**
 * View the state of the table (the publicly known cards).
 *
 * @param lobbyCode - The address of the instantiated contract.
 * @param networkClient - A Secret Network client initialised with Keplr.
 *
 * @returns A result containing an object representation of the contract's
 *    response if successful, otherwise an error.
 */
async function viewTable(
  lobbyCode: string,
  networkClient: SecretNetworkClient,
): Promise<Result<object, Error>> {
  return secretts.queryContract(
    { view_table: {} },
    { contractAddress: lobbyCode, contractCodeHash: CONTRACT_CODE_HASH },
    networkClient,
  );
}

/**
 * View the player's hand and chip balance.
 *
 * @param lobbyCode - The address of the instantiated contract.
 * @param networkClient - A Secret Network client initialised with Keplr.
 *
 * @returns A result containing an object representation of the contract's
 *    respose if successful, otherise an error.
 */
async function viewPlayer(
  lobbyCode: string,
  networkClient: SecretNetworkClient,
): Promise<Result<object, Error>> {
  return Result.fromAsync(getPermit(lobbyCode, networkClient)).map((permit) =>
    secretts.queryContract(
      { view_player: { permit } },
      {
        contractAddress: lobbyCode,
        contractCodeHash: CONTRACT_CODE_HASH,
      },
      networkClient,
    ),
  );
}

/**
 * Query the contract for the balances of all bought-in players.
 *
 * @param lobbyCode - The address of the instantiated contract.
 * @param networkClient - A Secret Network client initialised with Keplr.
 *
 * @returns A result of an array containing two-tuples of a player's address
 *    and their balance.
 */
async function viewPlayers(
  lobbyCode: string,
  networkClient: SecretNetworkClient,
): Promise<Result<PlayerInfo[], Error>> {
  return secretts.queryContract(
    { view_players: {} },
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
    return Result.try(JSON.parse(queryPermitStored));
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
  createLobby,
  placeBet,
  startGame,
  viewPlayer,
  viewPlayers,
  viewTable,
};

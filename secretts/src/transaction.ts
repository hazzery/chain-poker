import { type TxResponse, TxResultCode } from "secretjs";
import { Result } from "typescript-result";

import Err from "./err.ts";

/**
 * Check that the status of the given transaction response is success.
 *
 * @param transactionResponse - The response from a transaction.
 *
 * @returns A result containing the transaction response if it was successful,
 *    otherwise an error.
 */
function transactionStatusCheck(
  transactionResponse: TxResponse,
): Result<TxResponse, Error> {
  if (transactionResponse.code !== TxResultCode.Success) {
    return Err(
      "Transaction failed.\n\n" +
        `Status code: ${TxResultCode[transactionResponse.code]}\n\n` +
        transactionResponse.rawLog,
    );
  }

  return Result.ok(transactionResponse);
}

/**
 * Find a value associated with a specified key in a transaction's logs.
 *
 * @param transactionResponse - The response from a transaction.
 * @param logKey - The key to look for in the transaction's logs.
 *
 * @returns A result of the value found in the logs if successful, otherwise an
 *    Error.
 */
function findInLogs(
  transactionResponse: TxResponse,
  logKey: string,
): Result<string, Error> {
  const value = transactionResponse.arrayLog?.find(
    (log) => log.type === "message" && log.key === logKey,
  )?.value;

  if (value === undefined) {
    return Err(`Unable to find ${logKey}`);
  }

  return Result.ok(value);
}

export { findInLogs, transactionStatusCheck };

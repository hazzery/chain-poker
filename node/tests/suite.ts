import * as secretts from "secretts";

import { ContractClient } from "./integration";
import { PreStartState } from "./types";

async function test_buy_in({
  networkClient,
  instantiateData,
}: ContractClient): Promise<boolean> {
  const [initialQueryData, initialQueryError] = (
    await secretts.queryContract<PreStartState>(
      { pre_start_state: {} },
      instantiateData,
      networkClient,
    )
  ).toTuple();

  if (initialQueryError) {
    return false;
  }

  const startingLength = initialQueryData.balances.length;

  const transactionError = (
    await secretts.tryExecute(
      { buy_in: { username: "USERNAME" } },
      20_000,
      instantiateData,
      networkClient,
    )
  ).error;

  if (transactionError) {
    return false;
  }

  const [queryData, queryError] = (
    await secretts.queryContract<PreStartState>(
      { pre_start_state: {} },
      instantiateData,
      networkClient,
    )
  ).toTuple();

  if (queryError) {
    return false;
  }

  if (queryData.balances.length !== startingLength + 1) {
    return false;
  }

  if (
    queryData.balances.find(([username]) => username === "USERNAME") ===
    undefined
  ) {
    return false;
  }

  return true;
}

export { test_buy_in };

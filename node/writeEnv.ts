import * as fs from "fs";
import { Result } from "typescript-result";

import { readUploadData } from "./src/io";

/**
 *  Updates the contents of the frontend's environment variables to use the
 *  newly uploaded contract.
 *
 * @returns A result of nothing if execution is successful, otherwise an Error.
 */
async function main(): Promise<Result<void, Error>> {
  const envFilePath = "../frontend/.env";

  return await Result.fromAsync(readUploadData()).map((uploadData) => {
    const envFileContents = `\
VITE_SECRET_CHAIN_ID=pulsar-3
VITE_SECRET_LCD=https://pulsar.lcd.secretnodes.com
VITE_CONTRACT_CODE_HASH=${uploadData.contractCodeHash}
VITE_CONTRACT_CODE_ID=${uploadData.codeId}
`;

    return Result.fromAsyncCatching(
      fs.promises.writeFile(envFilePath, envFileContents),
    );
  });
}

await Result.fromAsync(main()).onFailure((error) => {
  console.error(error);
  process.exit(1);
});

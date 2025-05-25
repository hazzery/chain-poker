import * as fs from "fs";
import * as glob from "glob";
import { Result } from "typescript-result";

interface UploadData {
  codeId: string;
  contractCodeHash: string;
}

interface InstantiateData {
  contractCodeHash: string;
  contractAddress: string;
}

/**
 * Write the code ID and contract code hash to the filesystem for future script
 * executions to read them.
 *
 * @param codeId - The uploaded contract Web Assembly code's unique identifier.
 * @param contractCodeHash - The hash of the contract's compiled binary Web
 *    Assembly, to verify we're querying the correct contract.
 *
 * @returns A result of nothing if writing was successful, otherwise a string error message.
 */
async function writeUploadData([codeId, contractCodeHash]: [
  string,
  string,
]): Promise<Result<void, string>> {
  const timestamp = new Date().toISOString();
  const json = JSON.stringify({ codeId, contractCodeHash });

  return await Result.fromAsyncCatching(
    fs.promises.writeFile(`upload-${timestamp}.json`, json),
  ).mapError(String);
}

/**
 * Type guard function to assert that an unknown value contains the code ID and
 * the contract code hash.
 *
 * @param uploadData - Absolutely any value, typically the output of a json
 *    parse.
 *
 * @returns `true` if the value has both the "codeId" and "contractCodeHash"
 *    string properties, `false` otherwise.
 */
function isValidUploadData(uploadData: unknown): uploadData is UploadData {
  return (
    uploadData instanceof Object &&
    "codeId" in uploadData &&
    typeof uploadData.codeId === "string" &&
    "contractCodeHash" in uploadData &&
    typeof uploadData.contractCodeHash === "string"
  );
}

/**
 * Maps unknown output to a result of a known type.
 *
 * @param uploadData - The output of a json parse.
 *
 * @returns A result containing `uploadData` if it has the required properties,
 *    otherwise a string error message.
 */
function castJsonUploadData(uploadData: unknown): Result<UploadData, string> {
  if (!isValidUploadData(uploadData)) {
    return Result.error(
      "Invalid upload data, must contain both codeId and contractCodeHash properties",
    );
  }

  return Result.ok(uploadData);
}

/**
 * Read in the value of the output from the latest contract upload.
 *
 * @returns A result of an object containing the contract's code ID and code
 *    hash if the data exists in the filesystem, otherwise a string error
 *    message.
 */
async function readUploadData(): Promise<Result<UploadData, string>> {
  const uploads = await glob.glob("upload-*.json");

  if (uploads.length === 0) {
    return Result.error("No upload files found");
  }

  const { filename } = uploads.reduce(
    (accumulator, filename) => {
      const date = new Date(filename.substring(7, filename.length - 5));
      return date > accumulator.date ? { date, filename } : accumulator;
    },
    { date: new Date(0), filename: "" },
  );

  return await Result.fromAsyncCatching(fs.promises.readFile(filename, "utf8"))
    .mapCatching(JSON.parse)
    .mapError(String)
    .map(castJsonUploadData);
}

/**
 * Write the code ID and contract code hash to the filesystem for future script
 * executions to read them.
 *
 * @param contractCodeHash - The hash of the contract's compiled binary Web
 *    Assembly, to verify we're querying the correct contract.
 * @param contractAddress - The network address of the contract instantiation.
 *
 * @returns A result of nothing if writing was successful, otherwise a string error message.
 */
async function writeInstantiaionData(
  contractCodeHash: string,
  contractAddress: string,
): Promise<Result<void, string>> {
  const timestamp = new Date().toISOString();
  const json = JSON.stringify({ contractCodeHash, contractAddress });

  return await Result.fromAsyncCatching(
    fs.promises.writeFile(`instantiation-${timestamp}.json`, json),
  ).mapError(String);
}

/**
 * Type guard function to assert that an unknown value contains the contract
 * code hash and contract address.
 *
 * @param instantiateData - Absolutely any value, typically the output of a
 *    json parse.
 *
 * @returns `true` if the value has both the "contractCodeHash" and
 *    "contractAddress" string properties, `false` otherwise.
 */
function isValidInstantiationData(
  instantiateData: unknown,
): instantiateData is InstantiateData {
  return (
    instantiateData instanceof Object &&
    "contractCodeHash" in instantiateData &&
    typeof instantiateData.contractCodeHash === "string" &&
    "contractAddress" in instantiateData &&
    typeof instantiateData.contractAddress === "string"
  );
}

/**
 * Maps unknown output to a result of a known type.
 *
 * @param instantiateData - The output of a json parse.
 *
 * @returns A result containing `instantiateData` if it has the required
 *    properties, otherwise a string error message.
 */
function castJsonInstantiateData(
  instantiateData: unknown,
): Result<InstantiateData, string> {
  if (!isValidInstantiationData(instantiateData)) {
    return Result.error(
      "Invalid instantiation data, must contain both contractCodeHash and contractAddress properties",
    );
  }

  return Result.ok(instantiateData);
}

/**
 * Read in the value of the output from the latest contract instantiation.
 *
 * @returns A result of an object containing the contract's code hash and
 *    address if the data exists in the filesystem, otherwise a string error
 *    message.
 */
async function readInstantiateData(): Promise<Result<InstantiateData, string>> {
  const instantiations = await glob.glob("instantiation-*.json");

  if (instantiations.length === 0) {
    return Result.error("No instantiation files found");
  }

  const { filename } = instantiations.reduce(
    (accumulator, filename) => {
      const date = new Date(filename.substring(14, filename.length - 5));
      return date > accumulator.date ? { date, filename } : accumulator;
    },
    { date: new Date(0), filename: "" },
  );

  return await Result.fromAsyncCatching(fs.promises.readFile(filename, "utf8"))
    .mapCatching(JSON.parse)
    .mapError(String)
    .map(castJsonInstantiateData);
}

export {
  writeUploadData,
  readUploadData,
  writeInstantiaionData,
  readInstantiateData,
};

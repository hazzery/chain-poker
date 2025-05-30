import * as fs from "fs";
import * as glob from "glob";
import { Result } from "typescript-result";

import Err from "../err";
import { InstantiateData, UploadData } from "../types";

const OUTPUT_DIRECTORY = "output/";

/**
 * Write the code ID and contract code hash to the filesystem for future script
 * executions to read them.
 *
 * @param uploadData - An object with both codeId: the uploaded contract's
 *    unique identifier and contractCodeHash: the hash of the contract's
 *    compiled binary Web Assembly, to verify we're querying the correct
 *    contract.
 *
 * @returns A result of nothing if writing was successful, otherwise an error.
 */
async function writeUploadData(
  uploadData: UploadData,
): Promise<Result<void, Error>> {
  const timestamp = new Date().toISOString();
  const json = JSON.stringify(uploadData);

  return await Result.fromAsyncCatching(
    fs.promises.writeFile(`${OUTPUT_DIRECTORY}/upload-${timestamp}.json`, json),
  );
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
 *    otherwise an error.
 */
function castJsonUploadData(uploadData: unknown): Result<UploadData, Error> {
  if (!isValidUploadData(uploadData)) {
    return Err(
      "Invalid upload data, must contain both codeId and contractCodeHash properties",
    );
  }

  return Result.ok(uploadData);
}

/**
 * Read in the value of the output from the latest contract upload.
 *
 * @returns A result of an object containing the contract's code ID and code
 *    hash if the data exists in the filesystem, otherwise an error.
 */
async function readUploadData(): Promise<Result<UploadData, Error>> {
  const uploads = await glob.glob("upload-*.json");

  if (uploads.length === 0) {
    return Err("No upload files found");
  }

  const { filename } = uploads.reduce(
    (accumulator, filename) => {
      const date = new Date(filename.substring(7, filename.length - 5));
      return date > accumulator.date ? { date, filename } : accumulator;
    },
    { date: new Date(0), filename: "" },
  );

  return await Result.fromAsyncCatching(fs.promises.readFile(filename, "utf8"))
    .mapCatching(JSON.parse as (_: string) => unknown)
    .map(castJsonUploadData);
}

/**
 * Write the code ID and contract code hash to the filesystem for future script
 * executions to read them.
 *
 * @param instantiateData - An object containing both contractCodeHash: the
 *    hash of the contract's compiled binary Web Assembly, to verify we're
 *    querying the correct contract and contractAddress: the network address
 *    of the contract instantiation.
 *
 * @returns A result of nothing if writing was successful, otherwise an error.
 */
async function writeInstantiaionData(
  instantiateData: InstantiateData,
): Promise<Result<void, Error>> {
  const timestamp = new Date().toISOString();
  const json = JSON.stringify(instantiateData);

  return await Result.fromAsyncCatching(
    fs.promises.writeFile(
      `${OUTPUT_DIRECTORY}/instantiation-${timestamp}.json`,
      json,
    ),
  );
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
 *    properties, otherwise an error.
 */
function castJsonInstantiateData(
  instantiateData: unknown,
): Result<InstantiateData, Error> {
  if (!isValidInstantiationData(instantiateData)) {
    return Err(
      "Invalid instantiation data, must contain both contractCodeHash and contractAddress properties",
    );
  }

  return Result.ok(instantiateData);
}

/**
 * Read in the value of the output from the latest contract instantiation.
 *
 * @returns A result of an object containing the contract's code hash and
 *    address if the data exists in the filesystem, otherwise an error.
 */
async function readInstantiateData(): Promise<Result<InstantiateData, Error>> {
  const instantiations = await glob.glob("instantiation-*.json");

  if (instantiations.length === 0) {
    return Err("No instantiation files found");
  }

  const { filename } = instantiations.reduce(
    (accumulator, filename) => {
      const date = new Date(filename.substring(14, filename.length - 5));
      return date > accumulator.date ? { date, filename } : accumulator;
    },
    { date: new Date(0), filename: "" },
  );

  return await Result.fromAsyncCatching(fs.promises.readFile(filename, "utf8"))
    .mapCatching(JSON.parse as (_: string) => unknown)
    .map(castJsonInstantiateData);
}

export {
  readInstantiateData,
  readUploadData,
  writeInstantiaionData,
  writeUploadData,
};

import * as fs from "fs";
import * as glob from "glob";
import { Result } from "typescript-result";

import Err from "../err";
import { InstantiateData, UploadData } from "../types";

const OUTPUT_DIRECTORY = "output";

/**
 * Type guard function to assert that an unknown value conforms to the given
 * object specification.
 *
 * @param something - Absolutely any value, typically the output of a
 *    json parse.
 *
 * @param spec - An object which maps property names to property types.
 *
 * @returns `true` if the value has all of the properties in `spec` of the
 *    specified types, `false` otherwise.
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
function isValid<T>(
  something: unknown,
  spec: Record<string, string>,
): something is T {
  if (typeof something !== "object" || something === null) {
    return false;
  }
  return Object.entries(spec).every(
    ([property, type]) =>
      property in something && typeof something[property] === type,
  );
}

/**
 * Maps unknown output to a result of a known type.
 *
 * @param something - Absolutely any value, typically the output of a
 *    json parse.
 *
 * @param spec - An object which maps property names to property types.
 *
 * @returns A result containing `something` cast as type `T` if it has the
 *    required properties, otherwise an error.
 */
function castUnknown<T>(
  something: unknown,
  spec: Record<string, string>,
): Result<T, Error> {
  if (!isValid<T>(something, spec)) {
    return Err(
      "Invalid instantiation data, must contain both contractCodeHash and contractAddress properties",
    );
  }

  return Result.ok(something);
}

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
    .map((value) =>
      castUnknown<UploadData>(value, {
        contractCodeHash: "string",
        codeId: "string",
      }),
    );
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
    .map((value) =>
      castUnknown<InstantiateData>(value, {
        contractCodeHash: "string",
        contractAddress: "string",
      }),
    );
}

export {
  readInstantiateData,
  readUploadData,
  writeInstantiaionData,
  writeUploadData,
};

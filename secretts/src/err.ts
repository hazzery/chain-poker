import { AsyncResult, Result } from "typescript-result";

function Err(message: string): Result<never, Error> {
  return Result.error(new Error(message));
}

function AsyncErr(message: string): AsyncResult<never, Error> {
  return new AsyncResult((resolve) =>
    resolve(Result.error(new Error(message))),
  );
}

export { Err as default, AsyncErr };

import { Result } from "typescript-result";

function Err(message: string): Result<never, Error> {
  return Result.error(new Error(message));
}

export default Err;


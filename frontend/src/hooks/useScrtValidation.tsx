import {
  useEffect,
  useState,
  type Dispatch,
  type StateUpdater,
} from "preact/hooks";
import type { ValidationState } from "./useStringValidation";

interface ScrtValidationRules {
  maxValueUscrt: bigint;
  minValueUscrt: bigint;
}

interface ScrtValidationState extends ValidationState {
  uScrt: bigint | null;
}

/**
 * Convert a string number of SCRT to a bigint number of uSCRT.
 *
 * @param scrt A string representing a number of whole SCRT tokens.
 *
 * @returns A bigint representation of `scrt`.
 */
function scrtToUscrt(scrt: string): bigint | null {
  if (!/^\d+(\.\d+)?$/.test(scrt)) {
    return null;
  }

  let [wholeScrt, fractionalScrt = ""] = scrt.split(".");
  fractionalScrt = fractionalScrt.slice(0, 6);

  const decimalPlaces = fractionalScrt.length;

  return (
    BigInt(wholeScrt) * 1_000_000n +
    BigInt(fractionalScrt) * BigInt(10 ** (6 - decimalPlaces))
  );
}

function useScrtValidation(
  rules: ScrtValidationRules,
  initialValue: string = "",
): [ScrtValidationState, Dispatch<StateUpdater<string>>] {
  const [scrtString, setValue] = useState<string>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [uScrt, setUScrt] = useState<bigint | null>(null);

  useEffect(() => {
    setUScrt(scrtToUscrt(scrtString));

    if (scrtString.trim() === "") {
      setError("This field is required");
    } else if (uScrt === null) {
      setError("This field must be a positive number");
    } else if (uScrt > rules.maxValueUscrt) {
      setError(`This field cannot exceed ${rules.maxValueUscrt / 1_000_000n}`);
    } else if (uScrt < rules.minValueUscrt) {
      setError(`This field must be at least ${rules.minValueUscrt / 1_000_000n}`);
    } else if (error !== null) {
      setError(null);
    }
  }, [scrtString, rules]);

  return [{ value: scrtString, error, uScrt }, setValue];
}

export default useScrtValidation;

import {
  useEffect,
  useState,
  type Dispatch,
  type StateUpdater,
} from "preact/hooks";
import type { ValidationState } from "./useStringValidation";

interface NumberValidationRules {
  required?: boolean;
  maxValue?: number;
  minValue?: number;
  integer?: boolean;
}

interface NumberValidationState extends ValidationState {
  number: number;
}

function useNumberValidation(
  rules: NumberValidationRules,
  initialValue: string = "",
): [NumberValidationState, Dispatch<StateUpdater<string>>] {
  const [value, setValue] = useState<string>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [numberValue, setNumberValue] = useState<number>(NaN);

  useEffect(() => {
    setNumberValue(Number(value));

    if (rules.required && value.trim() === "") {
      setError("This field is required");
    } else if (isNaN(numberValue)) {
      setError("This field must be numeric");
    } else if (rules.integer && numberValue % 1 !== 0) {
      setError("This field must be a whole number");
    } else if (rules.maxValue !== undefined && numberValue > rules.maxValue) {
      setError(`This field cannot exceed ${rules.maxValue}`);
    } else if (rules.minValue !== undefined && numberValue < rules.minValue) {
      setError(`This field must be at least ${rules.minValue}`);
    } else if (error !== null) {
      setError(null);
    }
  }, [value, rules]);

  return [{ value, error, number: numberValue }, setValue];
}

export { useNumberValidation as default };

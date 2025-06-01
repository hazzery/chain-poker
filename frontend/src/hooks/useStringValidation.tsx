import { useEffect, useState } from "preact/hooks";
import type { ValidationState } from "./useNumberValidation";

interface StringValidationRules {
  required?: boolean;
  maxLength?: number;
  minLength?: number;
}

function useStringValidation(
  rules: StringValidationRules,
  initialValue: string = "",
): [ValidationState, React.Dispatch<React.SetStateAction<string>>] {
  const [value, setValue] = useState<string>(initialValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let errorMessage = null;

    if (rules.required && value.trim() === "") {
      errorMessage = "This field is required";
    } else if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      errorMessage = `This field must be at most ${rules.maxLength} characters long`;
    } else if (rules.minLength !== undefined && value.length < rules.minLength) {
      errorMessage = `This field must be at least ${rules.minLength} characters long`;
    }

    setError(errorMessage);
  }, [value, rules]);

  return [{ value, error }, setValue];
}

export { useStringValidation as default };

import { useEffect, useState } from "preact/hooks";

interface ValidationRules {
  required?: boolean;
  maxValue?: number;
  minValue?: number;
  integer?: boolean;
}

interface ValidationState {
  value: string;
  error: string | null;
}

function useNumberValidation(
  rules: ValidationRules,
  initialValue: string = "",
): [ValidationState, React.Dispatch<React.SetStateAction<string>>] {
  const [value, setValue] = useState<string>(initialValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let newError = null;

    const numberValue = Number(value);
    if (rules.required && value.trim() === "") {
      newError = "This field is required";
    } else if (isNaN(numberValue)) {
      newError = "This field must be numeric";
    } else if (rules.integer && numberValue % 1 !== 0) {
      newError = "This field must be a whole number";
    } else if (rules.maxValue !== undefined && numberValue > rules.maxValue) {
      newError = `This field cannot exceed ${rules.maxValue}`;
    } else if (rules.minValue !== undefined && numberValue < rules.minValue) {
      newError = `This field must be at least ${rules.minValue}`;
    }

    setError(newError);
  }, [value, rules]);

  return [{ value, error }, setValue];
}

export { useNumberValidation as default, type ValidationState };

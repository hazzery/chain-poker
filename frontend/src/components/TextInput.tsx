import { TextField, type TextFieldProps } from "@mui/material";
import { useState, type Dispatch, type StateUpdater } from "preact/hooks";
import type { ValidationState } from "../hooks/useNumberValidation";

interface TextInputProps {
  state: ValidationState;
  setState: Dispatch<StateUpdater<string>>;
}

function TextInput({
  state,
  setState,
  ...textFieldProps
}: TextInputProps & TextFieldProps) {
  const [hasBeenFocused, setHasBeenFocused] = useState<boolean>(false);

  return (
    <TextField
      error={hasBeenFocused && state.error !== null}
      helperText={hasBeenFocused && state.error}
      value={state.value}
      onChange={(event) => setState(event.target.value)}
      onBlur={() => setHasBeenFocused(true)}
      {...textFieldProps}
    ></TextField>
  );
}

export default TextInput;

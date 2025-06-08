import type { TextFieldProps } from "@mui/material";
import type { Dispatch, StateUpdater } from "preact/hooks";

import scrtLogo from "../../resources/scrt.svg";
import type { ValidationState } from "../hooks/useNumberValidation";
import TextInput from "./TextInput";

interface ScrtInputProps {
  state: ValidationState;
  setState: Dispatch<StateUpdater<string>>;
}

function ScrtInput(props: ScrtInputProps & TextFieldProps) {
  return (
    <TextInput
      slotProps={{
        input: { startAdornment: <img src={scrtLogo} width="20em" /> },
        htmlInput: { sx: { paddingLeft: "0.4em" } },
      }}
      {...props}
    ></TextInput>
  );
}

export default ScrtInput;

import { CircularProgress } from "@mui/material";
import ChainPoker from "./ChainPoker";

function Loading() {
  return (
    <ChainPoker>
      <CircularProgress color="success" />
    </ChainPoker>
  );
}

export default Loading;

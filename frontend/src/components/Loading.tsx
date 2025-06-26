import { CircularProgress } from "@mui/material";
import ChainPoker from "./ChainPoker";

function Loading() {
  return (
    <ChainPoker>
      <CircularProgress />
    </ChainPoker>
  );
}

export default Loading;

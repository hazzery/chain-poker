import { Typography } from "@mui/material";
import type { VNode } from "preact";

function NotFound(): VNode {
  return (
    <Typography marginTop="3em" fontSize="2em" marginLeft="1em">
      404: Not Found
    </Typography>
  );
}

export default NotFound;

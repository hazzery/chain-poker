import { Typography } from "@mui/material";
import type { VNode } from "preact";
import { useEffect } from "preact/hooks";

function NotFound(): VNode {
  useEffect(() => {
    document.title = "Page not found - Chain Poker";
  }, []);

  return (
    <Typography marginTop="3em" fontSize="2em" marginLeft="1em">
      404: Not Found
    </Typography>
  );
}

export default NotFound;

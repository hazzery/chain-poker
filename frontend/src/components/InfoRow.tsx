import { Stack, Typography } from "@mui/material";
import type { VNode } from "preact";

interface InfoRowProps {
  label: string;
  value: string | number | VNode;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography color="text.secondary">{label}</Typography>
      <Typography paddingLeft="1em">{value}</Typography>
    </Stack>
  );
}

export default InfoRow;

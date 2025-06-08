import { Box } from "@mui/material";
import type { ComponentChildren } from "preact";

import type { PlayerInfo } from "../secretnetwork/types";
import useWindowSize from "../hooks/useWindowSize";
import Player from "./Player";

// Container component that arranges children in a circle
interface FanLayoutProps {
  children?: ComponentChildren;
  players: PlayerInfo[];
  radii?: { x: number; y: number };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function FanLayout({ children, players, radii }: FanLayoutProps) {
  const { width, height } = useWindowSize();
  const count = players.length;

  let xradius: number;
  let yradius: number;
  if (radii === undefined) {
    xradius = clamp(width * 0.025, 20, 38);
    yradius = clamp(height * 0.015, 10, 30);
  } else {
    xradius = radii.x;
    yradius = radii.y;
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {children}
      </Box>

      {players.map((player, index) => {
        // Calculate the angle in radians. Adjust the starting angle as necessary.
        // For example, starting at -90 degrees (top of circle).
        const angle = ((index / count) * 360 - 90) * (Math.PI / 180);
        const x = xradius * Math.cos(angle);
        const y = yradius * Math.sin(angle);
        return (
          <Player
            name={player.name}
            chipBalance={player.chipBalance}
            sx={{
              position: "absolute",
              transform: "translate(-50%, -50%)",
              top: `calc(50% + ${y}em)`,
              left: `calc(50% + ${x}em)`,
            }}
          />
        );
      })}
    </Box>
  );
}

export default FanLayout;

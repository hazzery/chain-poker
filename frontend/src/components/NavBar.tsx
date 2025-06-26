import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import type { VNode } from "preact";
import { useLocation } from "preact-iso";
import { GiPokerHand } from "react-icons/gi";

function NavBar(): VNode {
  const location = useLocation();

  return (
    <AppBar>
      <Toolbar>
        <Button
          variant="text"
          color="inherit"
          onClick={() => location.route("/")}
        >
          <GiPokerHand size="2.5em" />
          <Typography
            variant="h6"
            component="div"
            marginLeft="0.7em"
            style={{ textTransform: "none" }}
          >
            Chain Poker
          </Typography>
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default NavBar;

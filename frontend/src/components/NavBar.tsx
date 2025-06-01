import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { GiPokerHand } from "react-icons/gi";

function NavBar() {
  return (
    <AppBar color="success">
      <Toolbar>
        <GiPokerHand size="2.5em"/>
        <Typography variant="h6" component="div" marginLeft="0.7em">
          Chain Poker
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default NavBar;

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

function NavBar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div">
          Chain Poker
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default NavBar;

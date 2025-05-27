import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

function NavBar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div">
          Chain Poker
        </Typography>
        <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            sx={{
              ml: "auto",
              minWidth: "40px",
              minHeight: "40px",
              padding: 0,
            }}
          ></Button>
          <Button
            variant="contained"
            size="small"
            sx={{
              ml: "auto",
              minWidth: "40px",
              minHeight: "40px",
              padding: 0,
            }}
          ></Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default NavBar;

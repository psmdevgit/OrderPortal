import React from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LogoutIcon from "@mui/icons-material/Logout";

function Navbar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const isMobile = useMediaQuery("(max-width:600px)");

  const handleLogoClick = () => {
    navigate("/main"); // simply navigate — no data loss
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      p={isMobile ? 1 : 2}
      sx={{
        background: "#1976d2",
        color: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {/* LEFT SECTION */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent={isMobile ? "flex-start" : "flex-start"}
        flex={1}
      >
        {isMobile ? (
          <Typography variant="h6" fontWeight="bold" onClick={handleLogoClick}>
            Order Portal
          </Typography>
        ) : (
          <Typography variant="h6" fontWeight="bold" onClick={handleLogoClick}>
            Order Portal
          </Typography>
        )}
      </Box>

      {/* RIGHT SECTION */}
      <Box
        display="flex"
        justifyContent="flex-end"
        alignItems="center"
        flex={1}
        gap={isMobile ? 0.5 : 1.5}
      >
        
          
{/* <Button
  variant="contained"
  sx={{
    backgroundColor: "grey.500",
    color: "#fff",
    "&:hover": { backgroundColor: "grey.700" },
  }}
  onClick={() => {
    localStorage.removeItem("customerVendorDetails");
    navigate("/form");
  }}
>
  Back
</Button> */}

  {isMobile ? (
    // 👇 Mobile View (use back icon)
    <Tooltip title="Back">
      <IconButton
        color="inherit"
        onClick={() => {
          localStorage.removeItem("customerVendorDetails");
          navigate("/form");
        }}
      >
        <ArrowBackIcon />
      </IconButton>
    </Tooltip>
  ) : (
    // 👇 Desktop View (use full Back button)
    <Button
      variant="contained"
      sx={{
        backgroundColor: "grey.500",
        color: "#fff",
        "&:hover": { backgroundColor: "grey.700" },
      }}
      onClick={() => {
        localStorage.removeItem("customerVendorDetails");
        navigate("/form");
      }}
    >
      Back
    </Button>
  )}







        {isMobile ? (
          <>
            {pathname === "/main" && (
              <Tooltip title="My Orders">
                <IconButton color="inherit" onClick={() => navigate("/cart")}>
                  <ShoppingCartIcon />
                </IconButton>
              </Tooltip>
            )}

            {pathname === "/cart" && (
              <Tooltip title="Home">
                <IconButton color="inherit" onClick={() => navigate("/main")}>
                  <HomeIcon />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Logout">
              <IconButton
                color="inherit"
                onClick={() => {
                  localStorage.removeItem("loggedUser");
                  localStorage.removeItem("customerVendorDetails");
                  navigate("/");
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <>
            {pathname === "/main" && (
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate("/cart")}
              >
                My Orders
              </Button>
            )}

            {pathname === "/cart" && (
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate("/main")}
              >
                Home
              </Button>
            )}

            <Button
              variant="contained"
              color="warning"
              onClick={() => {
                localStorage.removeItem("loggedUser");
                localStorage.removeItem("customerVendorDetails");
                navigate("/");
              }}
            >
              Logout
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}

export default Navbar;

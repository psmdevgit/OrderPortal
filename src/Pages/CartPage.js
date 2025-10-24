import Navbar from "../components/NavBar";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

// ✅ Helper: Model image loader with extension fallback
function ModelImage({ modelPath, baseUrl }) {
  const [src, setSrc] = useState("/no-image.png"); // default fallback

  useEffect(() => {
    if (!modelPath) return;

    const extensions = ["png", "jpg", "jpeg"];
    let isMounted = true;

    (async () => {
      for (const ext of extensions) {
        const url = `${baseUrl}${modelPath}.${ext}`;
        try {
          await new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(true);
            img.onerror = () => reject(false);
          });

          if (isMounted) {
            setSrc(url); // ✅ Found valid image
          }
          break;
        } catch {
          console.log(`Image not found: ${url}`);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [modelPath, baseUrl]);

  return <img src={src} alt="model" style={{ height: 50, borderRadius: 4 }} />;
}

export default function CartPage({ user }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [currentUser, setCurrentUser] = useState(user);

  const ApiBaseUrl = "https://kalash.app";

  // ✅ Step 1: Restore user from localStorage if missing
  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem("customerVendorDetails");
      if (stored) setCurrentUser(JSON.parse(stored));
    }
  }, [user]);

  // ✅ Step 2: Fetch orders when user data available
  useEffect(() => {
    const activeUser = user || currentUser;
    if (!activeUser?.customerMobile) return;

    console.log("Fetching orders for:", activeUser.customerMobile);

    fetch(`${ApiBaseUrl}/api/ordersDetails?mobile=${activeUser.customerMobile.trim()}`)
      .then((res) => res.json())
      .then((data) => setOrders(data))
      .catch((err) => console.error("Fetch orders error:", err));
  }, [user, currentUser]);

  // ✅ Step 3: Guard if no user data
  if (!currentUser) {
    return (
      <Box textAlign="center" mt={5}>
        <Typography mb={2}>Please fill the form first.</Typography>
        <Button
          variant="contained"
          sx={{ bgcolor: "black", "&:hover": { bgcolor: "#333" } }}
          onClick={() => navigate("/")}
        >
          Login
        </Button>
      </Box>
    );
  }

  // ✅ Step 4: Render Orders
  return (
    <Box sx={{ pb: 5, bgcolor: "#f9f9f9", minHeight: "100vh" }}>
      <Navbar user={currentUser} />

      <Box sx={{ maxWidth: 900, mx: "auto", pt: 4, px: 2 }}>
        <Typography variant="h5" mb={3} textAlign="center">
          Order History
        </Typography>

        {orders.length === 0 ? (
          <Typography textAlign="center" mt={5} color="text.secondary">
            No orders found.
          </Typography>
        ) : (
          orders.map((order) => (
            <Paper
              key={order.OrderId}
              sx={{
                p: 3,
                mb: 4,
                borderRadius: 2,
                boxShadow: 3,
                bgcolor: "#ffffff",
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Order ID: {order.OrderId}
                </Typography>
                <Typography>
                  <strong>Vendor:</strong> {order.Vendor_name} ({order.Vendor_mobileno})
                </Typography>
                <Typography>
                  <strong>Customer:</strong> {order.Customer_Name || "-"} (
                  {order.Customer_mobileNo || "-"})
                </Typography>
                <Typography>
                  <strong>Created:</strong>{" "}
                  {new Date(order.createdDate).toLocaleString()}
                </Typography>
              </Box>

              {order.items?.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <TableContainer
                    sx={{
                      maxHeight: 250,
                      width: "100%",
                    }}
                  >
                    <Table
                      sx={{
                        minWidth: 650,
                        "& th, & td": {
                          textAlign: "center",
                          fontSize: {
                            xs: "0.7rem",
                            sm: "0.85rem",
                            md: "0.9rem",
                          },
                          padding: { xs: "2px 4px", sm: "4px 8px" },
                        },
                      }}
                      stickyHeader
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell>Model No</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Image</TableCell>
                          <TableCell>Order Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {order.items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.ModelNo}</TableCell>
                            <TableCell>{item.Quantity}</TableCell>
                            <TableCell>
                              <ModelImage
                                modelPath={item.ModelNo}
                                baseUrl="http://192.168.5.13:8080/models/"
                              />
                            </TableCell>
                            <TableCell>
                              {new Date(item.Order_Date).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Paper>
          ))
        )}
      </Box>
    </Box>
  );
}

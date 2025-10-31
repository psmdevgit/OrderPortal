import Navbar from "../components/NavBar";
import jsPDF from "jspdf"; 
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

  
  const imageapi = "https://psmport.pothysswarnamahalapp.com/FactoryModels/";

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

   const cleanText = (txt) => (txt ? String(txt).trim() : "");

const previewPdf = async (order) => {
  try {
    // Generate vendor PDF for that specific order
    const { pdfBlob: vendorPdf } = await generateOrderPDF(order, user, "vendor");

    // Open in new tab
    window.open(URL.createObjectURL(vendorPdf), "_blank");
  } catch (err) {
    console.error("Error generating PDF:", err);
    alert("Error generating PDF. Please check console.");
  }
};

const generateOrderPDF = async (order, user, type) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ✅ Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(
    type === "vendor" ? cleanText(user.vendorName) : cleanText(user.customerName),
    pageWidth / 2,
    20,
    { align: "center" }
  );

  doc.setLineWidth(0.3);
  doc.line(10, 24, pageWidth - 10, 24);

  // ✅ Order Info
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  let startY = 30;

  doc.text(`Order ID: ${cleanText(order.OrderId)}`, 14, startY);
  doc.text(
    `Date: ${new Date(order.createdDate).toLocaleString()}`,
    pageWidth - 14,
    startY,
    { align: "right" }
  );

  startY += 10;

  // ✅ Vendor vs Customer info
  if (type === "vendor") {
    doc.text(`Vendor: ${cleanText(user.vendorName)}`, 14, startY);
    startY += 6;
    doc.text(`Mobile: ${cleanText(user.vendorMobile)}`, 14, startY);
    startY += 6;
    doc.text(`Customer: ${cleanText(user.customerName)}`, 14, startY);
    startY += 6;
    doc.text(`Customer Mobile: ${cleanText(user.customerMobile)}`, 14, startY);
  } else {
    doc.text(`Customer: ${cleanText(user.customerName)}`, 14, startY);
    startY += 6;
    doc.text(`Mobile: ${cleanText(user.customerMobile)}`, 14, startY);
    startY += 6;
    doc.text(`Vendor: ${cleanText(user.vendorName)}`, 14, startY);
    startY += 6;
    doc.text(`Vendor Mobile: ${cleanText(user.vendorMobile)}`, 14, startY);
  }

  startY += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Models List", 14, startY);
  startY += 6;

  // ✅ Models listing
doc.setFont("helvetica", "normal");
let totalQty = 0;

order.items.forEach((m, i) => {
  const line = `${cleanText(m.ModelNo)}`;   //${i + 1}.

  // ensure quantity is numeric
  const qtyNum = Number(m.Quantity) || 0;
  const qty = `Qty: ${qtyNum}`;

  doc.text(line, 14, startY);
  doc.text(qty, pageWidth - 14, startY, { align: "right" });

  totalQty += qtyNum; // ✅ accumulate as number
  startY += 7;

  // Auto new page if text reaches bottom
  if (startY > 270) {
    doc.addPage();
    startY = 20;
  }
});

startY += 6;
doc.setFont("helvetica", "bold");
doc.text(`Total Quantity: ${totalQty}`, 14, startY);

  // ✅ Convert to Blob
  const pdfBlob = doc.output("blob");
  const pdfBase64 = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.readAsDataURL(pdfBlob);
  });

  return { pdfBase64, pdfBlob };
};

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
               <Button
  variant="contained"
  onClick={() => previewPdf(order)} // wrapped in arrow function
>
  Preview PDF
</Button>

              )}

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
                                baseUrl={imageapi}
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

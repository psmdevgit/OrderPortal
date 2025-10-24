

import { useState, useEffect, useRef  } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Grid,
  useMediaQuery,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import Navbar from "../components/NavBar";
import { jsPDF } from "jspdf";
import logo from "../assets/Images/pos.png";
import { useTheme } from "@mui/material/styles";

function ModelImage({ imageName, imageapi }) {
  const [src, setSrc] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    if (!imageName) return;
    const extensions = ["png", "jpg", "jpeg"];
    let found = false;

    (async () => {
      for (const ext of extensions) {
        const url = `${imageapi}${imageName}.${ext}`;
        try {
          const img = new Image();
          img.src = url;
          await new Promise((resolve, reject) => {
            img.onload = () => resolve(true);
            img.onerror = () => reject(false);
          });
          setSrc(url);
          found = true;

          console.log("image url :",url);

          break;
        } catch {
          console.log(`❌ Image not found: ${url}`);
        }
      }
      if (!found) setSrc("/no-image.png");
    })();
  }, [imageName, imageapi]);

  console.log("image url :", src);

  if (!src) return <Typography variant="body2">Loading...</Typography>;

  return (
    <CardMedia
      component="img"
      image={src}
      alt={imageName}
      sx={{
        height: isMobile ? 125 : 170, // different image size for mobile/desktop
        objectFit: "contain",
        background: "#fafafa",
        borderRadius: 1,
      }}
    />
  );
}

export default function MainPage({ user }) {

 
  
  const [currentUser, setCurrentUser] = useState(user);
  

  const [scanCode, setScanCode] = useState("");
  const [models, setModels] = useState([]);
  const [scannedModels, setScannedModels] = useState([]);

  const refreshBtnRef = useRef(null);

  useEffect(() => {
    // Trigger the hidden button click once
    if (!user) {
    console.log("Page refresh triggered!");
    window.location.reload(); // Full page reload
    }
  }, []);


  
  const ApiBaseUrl = "https://kalash.app";
  const imageapi = "https://psmport.pothysswarnamahalapp.com/FactoryModels/";
  
  // const ApiBaseUrl = "http://localhost:4001";
  // const imageapi = "http://192.168.5.13:8080/models/";
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

 // ✅ Keep all hooks first
useEffect(() => {
  if (!user) {
    const stored = localStorage.getItem("customerVendorDetails");
    if (stored) setCurrentUser(JSON.parse(stored));
  }
}, [user]);

 useEffect(() => {

    console.log("User : ",user);
    fetch(`${ApiBaseUrl}/api/models`)
      .then((res) => res.json())
      .then((data) => setModels(data))
      .catch((err) => console.error("Error loading models:", err));
  }, []);

// ✅ THEN handle conditional rendering after hooks
if (!currentUser) {
  return (
    <Typography textAlign="center" mt={5}>
      Please fill the form first.
    </Typography>
  );
}
 

const handleScan = () => {
  const trimmedCode = scanCode.trim();
  if (!trimmedCode) return;

  // Take last segment after last dot
  const lastSegment = trimmedCode.split(".").pop(); // e.g., BGPL-9999

  // Match 4 letters + '-' + digits
  const match = lastSegment.match(/([a-zA-Z]{4}-\d+)/i);
  if (!match) {
    alert("Invalid scan code format! Must be like ABCD-1234");
    return;
  }

  const modelCode = match[1].toUpperCase(); // e.g., BGPL-9999

  // Check if already scanned
  const exists = scannedModels.find((m) => m.code === modelCode);
  if (exists) {
    alert(`${modelCode} already scanned!`);
    setScanCode("");
    return;
  }

  // Add new scanned model
  setScannedModels((prev) => [
    ...prev,
    { code: modelCode, name: modelCode, quantity: 1 },
  ]);

  console.log("model : ", scannedModels);

  setScanCode(""); // clear input
};




  const handleQuantityChange = (code, value) => {
    setScannedModels((prev) =>
      prev.map((m) => (m.code === code ? { ...m, quantity: value } : m))
    );
  };

  const handleDeleteModel = (code) => {
    setScannedModels((prev) => prev.filter((m) => m.code !== code));
  };

  const handleSave = async () => {
    if (scannedModels.length === 0) {
      alert("No models scanned!");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to save Order with ${scannedModels.length} item(s)?`
    );
    if (!confirmed) return;

    try {

          // ✅ Step 1: Ensure all scanned models exist in modelmaster
          for (let m of scannedModels) {
            await fetch(`${ApiBaseUrl}/api/models/check-or-insert`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                Modelname: m.code, // use the extracted scan code
                modelNo: m.code,
                status: "A",
                Modelpath: `/Models/${m.code}`,
                VendorCode: null,
                CreatedDate: new Date().toISOString(),
              }),
            });
          }

      
    // ✅ Step 2: Get last order ID
      const res = await fetch(`${ApiBaseUrl}/api/lastorder`);
      const data = await res.json();
      let newOrderId = "ORD1";
      if (data.lastOrderId) {
        const lastNum = parseInt(data.lastOrderId.replace("ORD", "")) || 0;
        newOrderId = "ORD" + (lastNum + 1);
      }

      const orderData = { orderId: newOrderId, user, models: scannedModels };
      await fetch(`${ApiBaseUrl}/api/itemorders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });


    const doc = new jsPDF();
const pageWidth = doc.internal.pageSize.getWidth();

// ✅ Skip logo section (removed)
// const logoWidth = 30;
// const logoHeight = 30;
// const logoY = 10; 
// doc.addImage(logo, "PNG", (pageWidth - logoWidth) / 2, logoY, logoWidth, logoHeight);

// ✅ Company Name at top (centered)
doc.setFontSize(18);
doc.setFont("helvetica", "bold");
doc.text(user.vendorName, pageWidth / 2, 20, { align: "center" });

// ✅ Add a thin separator line
doc.setLineWidth(0.3);
doc.line(10, 24, pageWidth - 10, 24);

// ✅ Order/user details
doc.setFontSize(12);
doc.setFont("helvetica", "normal");
let startY = 30;

doc.text(`Order ID: ${newOrderId}`, 14, startY);
doc.text(
  `Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
  pageWidth - 14,
  startY,
  { align: "right" }
);

if (user.role === "vendor") {
  startY += 8;
  doc.text(`Name : ${user.name || user.customerName}`, 14, startY);
  startY += 6;
  doc.text(`Mobile : ${user.mobile || user.customerMobile}`, 14, startY);
}

if (user.role === "customer") {
  startY += 8;
  doc.text(`Name : ${user.customerName || user.name}`, 14, startY);
  startY += 6;
  doc.text(`Mobile : ${user.customerMobile || user.mobile}`, 14, startY);
  startY += 6;
  doc.text(`Vendor Name : ${user.vendorName || user.name}`, 14, startY);
  startY += 6;
  doc.text(`Vendor Mobile : ${user.vendorMobile || user.mobile}`, 14, startY);
}

// ✅ Space before models list
startY += 12;
doc.setFont("helvetica", "bold");
doc.text("Models List", 14, startY);
startY += 6;

// ✅ Table-like layout for models
doc.setFont("helvetica", "normal");
let totalQty = 0;

scannedModels.forEach((m, i) => {
  const line = `${i + 1}. ${m.name}`;
  const qty = `Qty: ${m.quantity}`;
  doc.text(line, 14, startY);
  doc.text(qty, pageWidth - 14, startY, { align: "right" });
  totalQty += m.quantity;
  startY += 7;
});

// ✅ Add total quantity at end
startY += 6;
doc.setFont("helvetica", "bold");
doc.text(`Total Quantity: ${totalQty}`, 14, startY);

// ✅ Convert PDF to Base64
const pdfBlob = doc.output("blob");
const pdfBase64 = await new Promise((resolve) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result.split(",")[1]);
  reader.readAsDataURL(pdfBlob);
});

    console.log(user);

    
    const emailData = {
        customerEmail: user.customerEmail,
        vendorEmail: user.vendorEmail,
        to: user.vendorEmail,
        subject: `Order Confirmation - ${newOrderId}`,
        // message: `Hello ${user.role === "customer" ? user.customerName : user.name},\n\nPlease find attached your order confirmation for ${newOrderId}.`,        
        message: `Please find attached your order confirmation for ${newOrderId}.`,
        filename: `${newOrderId}.pdf`,
        pdfBase64,
      };

      await fetch(`${ApiBaseUrl}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      });


doc.save(`${newOrderId}.pdf`);
      alert(`✅ Order ${newOrderId} saved & send to mail`);
      setScannedModels([]);
    } catch (err) {
      console.error("Error saving order:", err);
      alert("❌ Failed to save order!");
    }
  };

  return (
    <Box>
      <Navbar user={currentUser} />
      <Box p={3}>
        <Typography variant="h5" mb={2}>
          Scan Models
        </Typography>

     

        {/* Scan Input */}
        <Box display="flex" mb={2}>
          <TextField
            label="Scan Code"
            value={scanCode}
            onChange={(e) => {setScanCode(e.target.value)}}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
          />
          <Button variant="contained" sx={{ ml: 2 }} onClick={handleScan}>
            Add
          </Button>
        </Box>

        {/* Cards Layout */}
        {scannedModels.length > 0 && (
          <Grid
            container
            spacing={2}
            justifyContent={isMobile ? "center" : "flex-start"} // Center on mobile
          >
            {scannedModels.map((m) => (
              <Grid item xs={6} sm={6} md={3} lg={3} key={m.code}>
                <Card
                  sx={{
                    borderRadius: 2,
                    boxShadow: 3,
                    p: 1,
                    height: "100%",
                    width: "100%",
                    transition: "transform 0.2s",
                    "&:hover": { transform: "scale(1.02)" },
                  }}
                >
                  <ModelImage imageName={m.name} imageapi={imageapi} />
                  <CardContent sx={{ p: 1 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{ mt: 1, textAlign: "center" }}
                    >
                      {m.name}
                    </Typography>

                    {/* Quantity + Delete row */}
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      mt={1}
                    >
                      <TextField
                        type="number"
                        value={m.quantity}
                        onChange={(e) =>
                          handleQuantityChange(m.code, Number(e.target.value))
                        }
                        inputProps={{ min: 1 }}
                        size="small"
                        sx={{ width: "60px" }}
                      />
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteModel(m.code)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Save Button */}
        {scannedModels.length > 0 && (
          <Box textAlign="center" mt={3}>
            <Button variant="contained" onClick={handleSave}>
              Save & Send
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}




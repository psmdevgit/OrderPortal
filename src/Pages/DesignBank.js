


"use client";
import { useState, useEffect, useRef  } from "react";
import { LoadingButton } from "@mui/lab";
import { Eye } from "lucide-react";
import noimage from "../assets/Images/no.png";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import CloseIcon from "@mui/icons-material/Close";

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
// const apiBaseUrl = "http://localhost:4001";


const apiBaseUrl = "https://kalash.app";
const imageapi = "https://psmport.pothysswarnamahalapp.com/FactoryModels/";

export default function DesignBank({ user }) {
  const [categories, setCategories] = useState([]);


    const [currentUser, setCurrentUser] = useState(user);

    const [addedModels, setAddedModels] = useState([]); // Accumulated models across categories


  const [selectedCategory, setSelectedCategory] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [models, setModels] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);

  const [quantities, setQuantities] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down("sm"));


  useEffect(() => {
  fetch(`${apiBaseUrl}/category-groups`)
    .then(res => res.json())
    .then(res => {
      if (res && res.data) setCategories(res.data);
      else setCategories([]);
    })
    .catch(console.error);
}, []);


  /* FETCH MODELS */
  useEffect(() => {
    if (!selectedCategory) {
      setModels([]);
      setSelectedModels([]);
      return;
    }

    fetch(`${apiBaseUrl}/api/previewModels?categoryId=${selectedCategory}`)
      .then(res => res.json())
      .then(setModels)
      .catch(console.error);
  }, [selectedCategory]);

  /* IMAGE FALLBACK */
  const handleImageError = (e, modelName) => {
    const img = e.currentTarget;
    if (img.src.endsWith(".png"))
      img.src = `${imageapi}${modelName}.jpg`;
    else if (img.src.endsWith(".jpg"))
      img.src = `${imageapi}${modelName}.jpeg`;
    else img.src = noimage.src;
  };

  /* SELECT MODEL */
  const toggleModel = modelName => {
    setSelectedModels(prev => {
      if (prev.includes(modelName)) {
        const copy = { ...quantities };
        delete copy[modelName];
        setQuantities(copy);
        return prev.filter(m => m !== modelName);
      } else {
        setQuantities(q => ({ ...q, [modelName]: 1 }));
        return [...prev, modelName];
      }
    });
  };

const previewPdf = async () => {
  if (addedModels.length === 0) {
    alert("Select at least one model");
    return;
  }

  try {
    // Step 2: Get last order ID
    const res = await fetch(`${apiBaseUrl}/api/lastorder`);
    const data = await res.json();
    let newOrderId = "ORD1";
    if (data.lastOrderId) {
      const lastNum = parseInt(data.lastOrderId.replace("ORD", "")) || 0;
      newOrderId = "ORD" + (lastNum + 1);
    }

    const { pdfBlob: vendorPdf } = await generateOrderPDF(
      newOrderId,
      currentUser,
      addedModels.map(m => ({ name: m.modelName, quantity: m.quantity })),
      "vendor"
    );

    window.open(URL.createObjectURL(vendorPdf), "_blank");
  } catch (err) {
    console.error("Error generating PDF:", err);
    alert("Error generating PDF. Check console.");
  }
};

const handleSave = async () => {
  if (addedModels.length === 0) {
    alert("No models selected!");
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to save Order with ${addedModels.length} item(s)?`
  );
  if (!confirmed) return;

  try {
    setIsSaving(true);

    // Step 1: Ensure all models exist in modelmaster
    for (let m of addedModels) {
      await fetch(`${apiBaseUrl}/api/models/check-or-insert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Modelname: m.modelName,
          modelNo: m.modelName,
          status: "A",
          Modelpath: `/Models/${m.modelName}`,
          VendorCode: null,
          CreatedDate: new Date().toISOString(),
        }),
      });
    }

    // Step 2: Get last order ID
    const res = await fetch(`${apiBaseUrl}/api/lastorder`);
    const data = await res.json();
    let newOrderId = "ORD1";
    if (data.lastOrderId) {
      const lastNum = parseInt(data.lastOrderId.replace("ORD", "")) || 0;
      newOrderId = "ORD" + (lastNum + 1);
    }

    const mappedModels = addedModels.map(m => ({
  name: m.modelName,                 // ✅ matches backend
  code: m.modelName,                 // ✅ ModelNo
  quantity: m.quantity,
  image: ``    // optional but safe
}));

    // Step 3: Save order
    const orderData = { orderId: newOrderId, user: currentUser, models: mappedModels };

    console.log(orderData);
    
    await fetch(`${apiBaseUrl}/api/itemorders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    // Step 4: Generate PDF
    const { pdfBase64: vendorPdfBase64 } = await generateOrderPDF(
      newOrderId,
      currentUser,
      addedModels.map(m => ({ name: m.modelName, quantity: m.quantity })),
      "vendor"
    );

    // Step 5: Send email
    await fetch(`${apiBaseUrl}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: currentUser.vendorEmail,
        subject: `Order Confirmation - ${newOrderId}`,
        message: `Dear ${currentUser.vendorName},\n\nPlease find attached your order confirmation.`,
        filename: `${newOrderId}_Vendor.pdf`,
        pdfBase64: vendorPdfBase64,
      }),
    });

    alert(`✅ Order ${newOrderId} saved & sent via email`);

    // Reset everything
    setSelectedModels([]);
    setQuantities({});
    setSelectedCategory("");
    setAddedModels([]);
  } catch (err) {
    console.error("Error saving order:", err);
    alert("❌ Failed to save order!");
  } finally {
    setIsSaving(false);
  }
};



const handleRemoveAddedModel = (index) => {
  setAddedModels(prev => prev.filter((_, i) => i !== index));
};

  const cleanText = (text) => {
    if (!text) return "";
    return text.toString().replace(/\n/g, " ").replace(/\r/g, " ");
  };
   const generateOrderPDF = async (newOrderId, user, selectedModels, type) => {
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

    doc.text(`Order ID: ${cleanText(newOrderId)}`, 14, startY);
    doc.text(
      `Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
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

    selectedModels.forEach((m, i) => {
      const line = `${cleanText(m.name)}`;        //${i + 1}.  
      const qty = `Qty: ${m.quantity}`;
      doc.text(line, 14, startY);
      doc.text(qty, pageWidth - 14, startY, { align: "right" });
      totalQty += m.quantity;
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

    // ✅ Convert to Blob & Base64
    const pdfBlob = doc.output("blob");
    const pdfBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(pdfBlob);
    });

    return { pdfBase64, pdfBlob };
  };

  const handleAddSelectedItem = () => {
  if (selectedModels.length === 0) {
    alert("Select at least one model");
    return;
  }

  const items = selectedModels.map(name => ({
    category: selectedCategory,
    modelName: name,
    quantity: quantities[name] || 1,
  }));

  // Merge with existing addedModels
  setAddedModels(prev => [...prev, ...items]);

  // Reset current selection
  setSelectedModels([]);
  setQuantities({});
  setSelectedCategory("");
};


  return (
    <div className="form-card p-4">
      {/* CATEGORY */}
      {/* <label className="block font-bold mb-2">Category</label> */}

       <Typography variant="h5" mb={2}>
          Category
        </Typography>

      <select
        value={selectedCategory}
        onChange={e => setSelectedCategory(e.target.value.trim())}
        className="w-full border p-2 rounded mb-4"
      >
        <option value="">-- Select Category --</option>
        {categories.map(c => (
          <option key={c.Id} value={c.Name}>
            {c.Name}
          </option>
        ))}
      </select>

      {/* MODELS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 max-h-[550px] overflow-auto">
        {models.map(model => {
          const selected = selectedModels.includes(model.Name);

          return (
            <div
              key={model.Id}
              className={`border rounded p-2 text-center ${
                selected ? "bg-blue-100 border-blue-500" : "bg-gray-100"
              }`}
            >
              <div className="relative">
                <img
                  src={`${imageapi}${model.Name}.png`}
                  onError={e => handleImageError(e, model.Name)}
                  onClick={() => toggleModel(model.Name)}
                  className="w-24 h-24 mx-auto object-contain cursor-pointer"
                  alt={model.Name}
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-white p-1 rounded shadow"
                  onClick={() =>
                    setPreviewImage(`${imageapi}${model.Name}.jpg`)
                  }
                >
                  <Eye size={14} />
                </button>
              </div>

              <p className="text-sm mt-2 font-medium">{model.Name}</p>

              {/* QUANTITY ONLY */}
              {selected && (
                <input
                  type="number"
                  min={1}
                  value={quantities[model.Name]}
                  onChange={e =>
                    setQuantities(q => ({
                      ...q,
                      [model.Name]: Math.max(1, Number(e.target.value)),
                    }))
                  }
                  className="mt-2 w-full border rounded p-1"
                />
              )}
            </div>
          );
        })}
      </div>

  

        <div style={{display:'flex', flexDirection:'row', gap:'10px', justifyContent:'center'}}>

         {selectedModels.length > 0 && (
          <Box textAlign="center" mt={3}>
            <Button variant="contained" color="warning" onClick={handleAddSelectedItem}>
              Add
            </Button>
          </Box>
        )}
        
  


         {addedModels.length > 0 && (
          <Box textAlign="center" mt={3}>
            <Button variant="contained" onClick={previewPdf}>
              preview pdf
            </Button>
          </Box>
        )}

              {addedModels.length > 0 && (
                  <Box textAlign="center" mt={3}>
                    <LoadingButton
                      variant="contained"
                      color="success"
                      onClick={handleSave}
                      loading={isSaving} // ✅ shows spinner when true
                      loadingPosition="start"
                    >
                      {isSaving ? "Processing..." : "Save"}
                    </LoadingButton>
                  </Box>
                )}

          </div>

          <div>
              {addedModels.length > 0 && (
                <div className="mt-4">
                  <Typography variant="h6">Added Models</Typography>
                  <ul>
                    {addedModels.map((m, idx) => (
                      <li
                          key={idx}
                          style={{
                            fontSize: isMobile ? "10px" : "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: isMobile ? "space-between" : "",
                            gap: "10px",
                          }}
                        >
                          <span>
                            {m.modelName} / {m.category} - Qty : {m.quantity}
                          </span>

                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleRemoveAddedModel(idx)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </li>

                    ))}
                  </ul>
                </div>
              )}
            </div>



{/* IMAGE PREVIEW MODAL */}
<Dialog
  open={Boolean(previewImage)}
  onClose={() => setPreviewImage(null)}
  maxWidth="sm"
  fullWidth
>
  <DialogContent
    sx={{
      position: "relative",
      p: 2,
      textAlign: "center",
    }}
  >
    {/* CLOSE BUTTON */}
    <IconButton
      onClick={() => setPreviewImage(null)}
      sx={{
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "#fff",
      }}
    >
      <CloseIcon />
    </IconButton>

    {/* IMAGE */}
    <img
      src={previewImage}
      alt="Preview"
      style={{
        maxWidth: "100%",
        maxHeight: "70vh",
        objectFit: "contain",
      }}
      onError={(e) => (e.currentTarget.src = noimage.src)}
    />
  </DialogContent>
</Dialog>


    </div>
  );
}

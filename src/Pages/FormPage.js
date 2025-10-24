import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Box, Paper, TextField, Button, Stack, Typography } from "@mui/material";

export default function FormPage({ user }) {
  const navigate = useNavigate();

  // ✅ Initialize user from localStorage if prop not available
  const storedUser = JSON.parse(localStorage.getItem("loggedUser") || "null");

//   const [currentUser, setCurrentUser] = useState(user || storedUser || null);
  
const [form, setForm] = useState({
  customerName: "",
  customerMobile: "",
  customerEmail: "",
  vendorName: "",
  vendorMobile: "",
  vendorEmail: user?.email || "", // ✅ fixed spelling + safe access
});


  const [userExistsMsg, setUserExistsMsg] = useState("");
  // const ApiBaseUrl = "http://localhost:4001";
  
  const ApiBaseUrl = "https://kalash.app";

  // ✅ Auto-fill vendor details from logged-in user
//   useEffect(() => {

//     console.log(user);
//     if (user) {
//       setForm((prev) => ({
//         ...prev,
//         vendorName: user.vendorname || user.name || "",
//         vendorMobile: user.mobile || user.vendorMobile || ""
//       }));
//     }
//   }, [user]);

useEffect(() => {
  console.log(user);
  if (user) {
    setForm((prev) => ({
      ...prev,
      vendorName: user.vendorname || user.name || "",
      vendorMobile: user.mobile || user.vendorMobile || "",
      vendorEmail: user.email || "",
    }));
  }
}, [user]);



  // ✅ Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

        setUserExistsMsg("");

    if (form.customerMobile.length !== 10) {
      setUserExistsMsg("Mobile number must be 10 digits");
      return;
    }


    try {
      const res = await fetch(`${ApiBaseUrl}/api/save-customer-details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        // ✅ Save combined details (customer + vendor)

        const fullDetails = { ...form };
        localStorage.setItem("customerVendorDetails", JSON.stringify(fullDetails));

        // Also update loggedUser so MainPage can access it
        localStorage.setItem("loggedUser", JSON.stringify({ ...user, ...fullDetails }));

        setUserExistsMsg("Customer details saved successfully!");
        setTimeout(() => navigate("/main"), 1000);


        // const fullDetails = { ...form };
        // localStorage.setItem("customerVendorDetails", JSON.stringify(fullDetails));

        // setUserExistsMsg("Customer details saved successfully!");
        // setTimeout(() => navigate("/main"), 1000);

        // setTimeout(() => navigate("/main", { state: { formData: fullDetails } }), 1000);

    } else {
        setUserExistsMsg(data.message || "Failed to save details");
      }
    } catch (error) {
      console.error("❌ Error saving details:", error);
      setUserExistsMsg("Server error. Please try again.");
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <Paper elevation={3} sx={{ p: 4, width: 400, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>Form Details</Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2} mt={1}>
            <TextField label="Customer Mobile" name="customerMobile" value={form.customerMobile} onChange={handleChange} fullWidth required type="number" />
            <TextField label="Customer Name" name="customerName" value={form.customerName} onChange={handleChange} fullWidth required />
            <TextField label="Customer Email" name="customerEmail" value={form.customerEmail} onChange={handleChange} fullWidth required />
            <TextField label="Vendor Name" name="vendorName" value={form.vendorName} onChange={handleChange} fullWidth disabled />
            <TextField label="Vendor Mobile" name="vendorMobile" value={form.vendorMobile} onChange={handleChange} fullWidth disabled />

            {userExistsMsg && (
              <Typography variant="body2" color="primary">
                {userExistsMsg}
              </Typography>
            )}

            <Stack direction="row" spacing={2} justifyContent="space-between" mt={2}>
              {/* <Button variant="outlined" onClick={() => navigate("/")}>Back</Button> */}

              <Button
                variant="outlined"
                onClick={() => {
                    localStorage.removeItem("loggedUser");
                    navigate("/");
                }}
                >
                Back
                </Button>


              <Button type="submit" variant="contained">Submit</Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

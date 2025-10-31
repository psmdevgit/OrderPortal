import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Box, Paper, TextField, Button, Stack, Typography } from "@mui/material";
// import logo from "../assets/images/pos.png";

function Login({ setUser }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [form, setForm] = useState({
    mobile: "",
    password: ""
  });

  const [errorMsg, setErrorMsg] = useState("");

  // const ApiBaseUrl = "http://localhost:4001";
  
  const ApiBaseUrl = "https://kalash.app";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "mobile") {
      if (!/^\d*$/.test(value) || value.length > 10) return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (form.mobile.length !== 10) {
      setErrorMsg("Mobile number must be 10 digits");
      return;
    }

    try {
      const res = await fetch(`${ApiBaseUrl}/api/vendor-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        console.log(data);
        setUser(data.user); 
        localStorage.setItem("loggedUser", JSON.stringify(data.user));
        navigate("/form");
      } else {
        setErrorMsg(data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      setErrorMsg(data.message || "Invalid password and mobile number.");
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <Paper elevation={3} sx={{ p: 4, width: 400, textAlign: "center" }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Vendor Login
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Vendor Mobile"
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              inputRef={inputRef}
              fullWidth
              required
              inputProps={{ maxLength: 10 }}
            />

            <TextField
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              fullWidth
              required
            />

            {errorMsg && (
              <Typography variant="body2" color="error">
                {errorMsg}
              </Typography>
            )}

            <Button type="submit" variant="contained" fullWidth>
              Submit
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

export default Login;
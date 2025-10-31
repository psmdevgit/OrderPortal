// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./Pages/Login";
import FormPage from "./Pages/FormPage";
import MainPage from "./Pages/MainPage";
import CartPage from "./Pages/CartPage";

function App() {
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedUser");
    const storedDetails = localStorage.getItem("customerVendorDetails");

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedDetails) setUserDetails(JSON.parse(storedDetails));

    setLoading(false);
  }, []);

  useEffect(() => {
    if (user)
      localStorage.setItem("loggedUser", JSON.stringify(user));
    else
      localStorage.removeItem("loggedUser");
  }, [user]);

  useEffect(() => {
    if (userDetails)
      localStorage.setItem(
        "customerVendorDetails",
        JSON.stringify(userDetails)
      );
    else
      localStorage.removeItem("customerVendorDetails");
  }, [userDetails]);

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      {/* <Routes>
        <Route path="/" element={<Login setUser={setUser} />} />
        <Route path="/form" element={<FormPage user={user} />} />
        <Route path="/main" element={<MainPage user={userDetails} />} />
        <Route path="/cart" element={<CartPage user={userDetails} />} />
      </Routes> */}

      <Routes>
  <Route path="/" element={<Login setUser={setUser} />} />
  <Route
    path="/form"
    element={<FormPage user={user} setUserDetails={setUserDetails} />}
  />
  <Route path="/main" element={<MainPage user={userDetails} />} />
  <Route path="/cart" element={<CartPage user={userDetails} />} />
</Routes>


    </Router>
  );
}

export default App;

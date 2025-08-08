// src/components/Navbar.jsx
import React from "react";
import "../css/navbar.css"; // Make sure this path is correct

const Navbar = ({ onSelect }) => {
  return (
    <nav className="navbar">
      <h1 className="navbar-title" onClick={() => onSelect("")}>
        Admin Dashboard
      </h1>

      <div className="navbar-buttons">
        <button onClick={() => onSelect("users")}>Users</button>
        <button onClick={() => onSelect("people")}>People</button>
      </div>
    </nav>
  );
};

export default Navbar;

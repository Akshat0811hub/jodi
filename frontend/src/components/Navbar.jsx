// src/components/Navbar.jsx
import React from "react";

const Navbar = ({ onSelect }) => {
  return (
    <nav className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
      {/* 🔄 Clickable title resets dashboard */}
      <h1
        className="text-xl font-bold cursor-pointer"
        onClick={() => onSelect("")}
      >
        Admin Dashboard
      </h1>

      <div className="space-x-4">
        <button
          onClick={() => onSelect("users")}
          className="hover:bg-gray-700 px-4 py-2 rounded"
        >
          Users
        </button>
        <button
          onClick={() => onSelect("people")}
          className="hover:bg-gray-700 px-4 py-2 rounded"
        >
          People
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

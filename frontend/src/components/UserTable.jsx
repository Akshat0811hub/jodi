// src/components/UserTable.jsx
import React, { useEffect, useState } from "react";
import api from "../api";
import "../css/userTable.css";

const UserTable = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const handleEdit = async (user) => {
    const email = prompt("New email:", user.email);
    const password = prompt("New password:");
    if (email && password) {
      try {
        await api.put(`/users/${user._id}`, { email, password });
        fetchUsers();
      } catch {
        alert("Failed to update user");
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete user?")) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch {
        alert("Failed to delete user");
      }
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="user-table-container">
      <h2 className="user-table-title">All Users</h2>
      <input
        type="text"
        placeholder="Search by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="user-search-input"
      />
      {filteredUsers.length === 0 ? (
        <p className="no-users">No users found.</p>
      ) : (
        <ul className="user-list">
          {filteredUsers.map((u) => (
            <li key={u._id} className="user-list-item">
              <strong>{u.name}</strong> ({u.email})
              <button onClick={() => handleEdit(u)} className="edit-btn">✏️ Edit</button>
              <button onClick={() => handleDelete(u._id)} className="delete-btn">🗑️ Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserTable;

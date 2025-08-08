// src/components/UserTable.jsx
import React, { useEffect, useState } from "react";
import api from "../api";

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

  // 🔍 Filtered user list (client-side filtering)
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-lg font-bold mb-2">All Users</h2>
      <input
        type="text"
        placeholder="Search by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border px-2 py-1 mb-4 w-full"
      />
      {filteredUsers.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <ul>
          {filteredUsers.map((u) => (
            <li key={u._id} className="mb-2">
              <strong>{u.name}</strong> ({u.email})
              <button onClick={() => handleEdit(u)} className="ml-2 text-blue-500">✏️ Edit</button>
              <button onClick={() => handleDelete(u._id)} className="ml-2 text-red-500">🗑️ Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserTable;

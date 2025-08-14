// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NODE_ENV === "production"
    ? "https://jodi-fi4e.onrender.com/api" // ✅ Render backend URL
    : "/api", // ✅ Localhost pe proxy se kaam lega
});

// 🔐 Automatically attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// src/api.js
import axios from "axios";

// ✅ Use environment variable or fallback to your Render URL
const baseURL = process.env.REACT_APP_API_URL || "https://jodi-fi4e.onrender.com/api";

console.log("🔗 API Base URL:", baseURL);

const api = axios.create({
  baseURL,
  timeout: 60000, // 60 second timeout for PDF generation
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log("🔄 API Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// ✅ Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("❌ API Error:", {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });
    
    // ✅ Handle different error types
    if (error.response?.status === 401) {
      console.log("🔓 Unauthorized - clearing token");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = "/login";
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error("⏱️ Request timeout");
    } else if (error.message.includes('Network Error')) {
      console.error("🌐 Network error - check if server is running");
    }
    
    return Promise.reject(error);
  }
);

export default api;
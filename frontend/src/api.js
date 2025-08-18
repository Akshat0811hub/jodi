// src/api.js
import axios from "axios";

// ✅ Use environment variable or fallback to your Render URL
const baseURL = process.env.REACT_APP_API_URL || "https://jodi-fi4e.onrender.com/api";

console.log("🔗 API Base URL:", baseURL);
console.log("🌍 Environment:", process.env.NODE_ENV);

const api = axios.create({
  baseURL,
  timeout: 60000, // 60 second timeout for PDF generation
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Request interceptor with better logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log("🔄 API Request:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
      hasToken: !!token
    });
    
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// ✅ Response interceptor with comprehensive error handling
api.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", {
      status: response.status,
      url: response.config.url,
      method: response.config.method?.toUpperCase()
    });
    return response;
  },
  (error) => {
    // Enhanced error logging
    const errorInfo = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      message: error.message,
      data: error.response?.data,
      code: error.code
    };
    
    console.error("❌ API Error:", errorInfo);
    
    // ✅ Handle different error types
    if (error.response?.status === 401) {
      console.log("🔓 Unauthorized - clearing token and redirecting");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Only redirect if not already on login/auth page
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/auth')) {
        setTimeout(() => {
          window.location.href = "/login";
        }, 100);
      }
    } else if (error.response?.status === 403) {
      console.error("🚫 Forbidden - insufficient permissions");
    } else if (error.response?.status === 404) {
      console.error("🔍 Not Found - check if server is running and route exists");
      console.error("🔗 Full URL attempted:", `${error.config?.baseURL}${error.config?.url}`);
    } else if (error.response?.status === 500) {
      console.error("💥 Server Error - check server logs");
    } else if (error.code === 'ECONNABORTED') {
      console.error("⏱️ Request timeout - server may be slow or down");
    } else if (error.message.includes('Network Error')) {
      console.error("🌐 Network error - check if server is running at:", baseURL);
    } else if (error.code === 'ERR_NETWORK') {
      console.error("📡 Network connection failed - server may be down");
    }
    
    return Promise.reject(error);
  }
);

// ✅ Helper function to check server health
export const checkServerHealth = async () => {
  try {
    const response = await axios.get(`${baseURL.replace('/api', '')}/health`, { timeout: 10000 });
    console.log("💚 Server health check passed:", response.data);
    return true;
  } catch (error) {
    console.error("💔 Server health check failed:", error.message);
    return false;
  }
};

// ✅ Helper function to test API connectivity
export const testAPI = async () => {
  try {
    const response = await api.get('/test');
    console.log("🎯 API test successful:", response.data);
    return true;
  } catch (error) {
    console.error("🎯 API test failed:", error.message);
    return false;
  }
};

export default api;
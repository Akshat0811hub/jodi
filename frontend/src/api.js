// src/api.js - UPDATED VERSION WITH BETTER FILE UPLOAD SUPPORT
import axios from "axios";

// ✅ Fixed: Use the correct base URL without /api suffix
const baseURL = process.env.REACT_APP_API_URL || "https://jodi-fi4e.onrender.com";

console.log("🔗 API Base URL:", baseURL);
console.log("🌍 Environment:", process.env.NODE_ENV);

const api = axios.create({
  baseURL: `${baseURL}/api`, // Add /api here for all API routes
  timeout: 120000, // ✅ INCREASED: 120 second timeout for file uploads (was 60s)
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Request interceptor with better logging and file upload handling
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // ✅ IMPROVED: Handle multipart form data
    if (config.data instanceof FormData) {
      // Remove Content-Type header for FormData - let browser set it with boundary
      delete config.headers["Content-Type"];
      console.log("📤 FormData request detected - removing Content-Type header");
      
      // Increase timeout for file uploads
      config.timeout = 180000; // 3 minutes for file uploads
      
      // Log FormData contents for debugging
      console.log("📤 FormData contents:");
      for (let [key, value] of config.data.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: FILE - ${value.name} (${(value.size / 1024 / 1024).toFixed(2)}MB)`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
    }
    
    console.log("🔄 API Request:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
      hasToken: !!token,
      timeout: config.timeout,
      contentType: config.headers["Content-Type"] || "multipart/form-data (auto)"
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
      method: response.config.method?.toUpperCase(),
      size: response.headers['content-length'] ? `${response.headers['content-length']} bytes` : 'unknown'
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
    } else if (error.response?.status === 413) {
      console.error("📦 Request Entity Too Large - files too big or too many files");
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
    // Direct call to health endpoint without /api prefix
    const response = await axios.get(`${baseURL}/health`, { timeout: 10000 });
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
    // This will call /api/test through the configured api instance
    const response = await api.get('/test');
    console.log("🎯 API test successful:", response.data);
    return true;
  } catch (error) {
    console.error("🎯 API test failed:", error.message);
    return false;
  }
};

// ✅ NEW: Helper function for file uploads with progress
export const uploadWithProgress = (url, formData, onProgress = null) => {
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 300000, // 5 minutes for large uploads
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    }
  });
};

export default api;
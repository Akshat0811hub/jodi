// src/api.js - FIXED VERSION WITH BETTER CORS AND ERROR HANDLING
import axios from "axios";

// ✅ Fixed: Use the correct base URL
const baseURL = process.env.REACT_APP_API_URL || "https://jodi-fi4e.onrender.com";

console.log("🔗 API Base URL:", baseURL);
console.log("🌍 Environment:", process.env.NODE_ENV);

const api = axios.create({
  baseURL: `${baseURL}/api`,
  timeout: 120000, // 2 minutes for regular requests
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // ✅ Changed: Set to false for CORS simplicity
});

// ✅ Request interceptor with better file upload handling
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // ✅ Handle FormData properly
    if (config.data instanceof FormData) {
      // Remove Content-Type header for FormData - let browser set it with boundary
      delete config.headers["Content-Type"];
      console.log("📤 FormData request detected - removing Content-Type header");
      
      // Increase timeout for file uploads
      config.timeout = 300000; // 5 minutes for file uploads
      
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

// ✅ Response interceptor with better error handling
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
      code: error.code,
      fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown'
    };
    
    console.error("❌ API Error Details:", errorInfo);
    
    // ✅ Handle specific CORS errors
    if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
      console.error("🚨 CORS/Network Error Detected:");
      console.error("   - Check if server is running at:", baseURL);
      console.error("   - Verify CORS configuration on server");
      console.error("   - Check if frontend URL is in CORS allowlist");
      console.error("   - Try: curl -X OPTIONS " + errorInfo.fullURL);
    }
    
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
      console.error("🔍 Not Found - check if server route exists");
      console.error("🔗 Full URL attempted:", errorInfo.fullURL);
    } else if (error.response?.status === 413) {
      console.error("📦 Request Entity Too Large - files too big or too many files");
    } else if (error.response?.status === 500) {
      console.error("💥 Server Error - check server logs");
    } else if (error.code === 'ECONNABORTED') {
      console.error("⏱️ Request timeout - server may be slow or down");
    } else if (error.message.includes('CORS')) {
      console.error("🔄 CORS Error - server CORS configuration issue");
    }
    
    return Promise.reject(error);
  }
);

// ✅ Helper function to check server health
export const checkServerHealth = async () => {
  try {
    // Direct call to health endpoint without /api prefix
    const response = await axios.get(`${baseURL}/health`, { 
      timeout: 10000,
      withCredentials: false 
    });
    console.log("💚 Server health check passed:", response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("💔 Server health check failed:", error.message);
    return { success: false, error: error.message };
  }
};

// ✅ Helper function to test API connectivity
export const testAPI = async () => {
  try {
    const response = await api.get('/test');
    console.log("🎯 API test successful:", response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("🎯 API test failed:", error.message);
    return { success: false, error: error.message };
  }
};

// ✅ Diagnostic function to test CORS
export const testCORS = async () => {
  try {
    console.log("🔍 Testing CORS configuration...");
    
    // Test OPTIONS request first
    const optionsResponse = await axios.options(`${baseURL}/api/people`, {
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      },
      timeout: 10000
    });
    
    console.log("✅ OPTIONS preflight successful:", optionsResponse.status);
    return { success: true, message: "CORS is working" };
    
  } catch (error) {
    console.error("❌ CORS test failed:", error.message);
    return { success: false, error: error.message };
  }
};

// ✅ Helper function for file uploads with progress
export const uploadWithProgress = (url, formData, onProgress = null) => {
  console.log("📤 Starting file upload to:", url);
  
  return api.post(url, formData, {
    timeout: 300000, // 5 minutes for large uploads
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`📊 Upload progress: ${percentCompleted}%`);
        onProgress(percentCompleted);
      }
    }
  });
};

// ✅ Add network status checker
export const isOnline = () => {
  return navigator.onLine;
};

// ✅ Add retry mechanism for failed requests
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await requestFn();
      return result;
    } catch (error) {
      lastError = error;
      console.log(`🔄 Request failed, attempt ${i + 1}/${maxRetries}:`, error.message);
      
      if (i < maxRetries - 1) {
        console.log(`⏱️ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError;
};

export default api;
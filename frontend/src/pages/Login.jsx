// src/components/Login.jsx - ENHANCED FASCINATING MODERN VERSION
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import '../css/login.css';

console.log("✅ Enhanced CSS imported");

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    
    // Basic validation with better UX
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      console.log("🔐 Attempting login for:", email);
      
      const res = await api.post("/auth/login", { 
        email: email.trim(), 
        password: password.trim() 
      });

      console.log("✅ Login response:", res.data);

      // Save token in localStorage
      localStorage.setItem("token", res.data.token);
      
      // Save user data from login response
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        console.log("✅ User data saved:", res.data.user);
      } else {
        // Fallback: fetch user profile
        try {
          const profileRes = await api.get("/users/me");
          localStorage.setItem("user", JSON.stringify(profileRes.data));
          console.log("✅ User profile fetched:", profileRes.data);
        } catch (profileError) {
          console.error("❌ Failed to fetch user profile:", profileError);
        }
      }

      // Success feedback
      showSuccessMessage(res.data.message || "Welcome back!");
      
      // Small delay for better UX
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
      
    } catch (err) {
      console.error("❌ Login error:", err);
      
      let errorMessage = "Login failed";
      
      if (err.response) {
        // Server responded with error
        if (err.response.status === 401) {
          errorMessage = "Invalid email or password";
        } else if (err.response.status === 429) {
          errorMessage = "Too many login attempts. Please try again later.";
        } else {
          errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
        }
        console.log("Server error details:", err.response.data);
      } else if (err.request) {
        // Network error
        errorMessage = "Network error - please check your connection";
        console.log("Network error:", err.request);
      } else {
        // Other error
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(""), 5000);
      
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMessage = (message) => {
    // Create a temporary success notification
    const successDiv = document.createElement('div');
    successDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(79, 172, 254, 0.4);
        z-index: 10000;
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        animation: slideInRight 0.5s ease-out;
      ">
        ✅ ${message}
      </div>
    `;
    
    document.body.appendChild(successDiv);
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    // Remove after 3 seconds
    setTimeout(() => {
      successDiv.remove();
      style.remove();
    }, 3000);
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2 className="login-text">Welcome Back</h2>
        
        {/* Error Display */}
        {error && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 154, 158, 0.2) 0%, rgba(254, 207, 239, 0.2) 100%)',
            color: '#dc2626',
            padding: '14px 18px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 154, 158, 0.3)',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'shake 0.5s ease-in-out'
          }}>
            <span>⚠️</span>
            {error}
          </div>
        )}
        
        <div className="input-group">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={loading}
            autoComplete="email"
            style={{ marginBottom: '0' }}
          />
        </div>
        
        <div className="input-group">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={loading}
            autoComplete="current-password"
            style={{ marginBottom: '0' }}
          />
        </div>
        
        <button 
          type="submit" 
          className={`login-btn ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          {loading ? (
            <>
              <span style={{ 
                display: 'inline-block', 
                marginRight: '8px',
                animation: 'spin 1s linear infinite' 
              }}>
                ⏳
              </span>
              Signing you in...
            </>
          ) : (
            <>
              🚀 Sign In
            </>
          )}
        </button>
        
        {/* Additional Features */}
        <div style={{
          marginTop: '25px',
          textAlign: 'center',
          fontSize: '14px',
          color: 'rgba(45, 55, 72, 0.7)'
        }}>
          <a href="#forgot-password" style={{
            color: '#667eea',
            textDecoration: 'none',
            fontWeight: '500',
            transition: 'color 0.3s ease'
          }}>
            Forgot your password?
          </a>
        </div>
        
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="debug-info">
            🔧 API URL: {process.env.REACT_APP_API_URL || 'Using default localhost'}
          </div>
        )}
        
        {/* Add CSS for shake animation */}
        <style jsx>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </form>
    </div>
  );
}

export default Login;
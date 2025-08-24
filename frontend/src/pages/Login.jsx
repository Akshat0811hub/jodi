// src/components/Login.jsx - Clean Simple Version
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import '../css/login.css'

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

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

      localStorage.setItem("token", res.data.token);
      
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        console.log("✅ User data saved:", res.data.user);
      } else {
        try {
          const profileRes = await api.get("/users/me");
          localStorage.setItem("user", JSON.stringify(profileRes.data));
          console.log("✅ User profile fetched:", profileRes.data);
        } catch (profileError) {
          console.error("❌ Failed to fetch user profile:", profileError);
        }
      }

      showSuccessMessage(res.data.message || "Welcome back!");
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
      
    } catch (err) {
      console.error("❌ Login error:", err);
      
      let errorMessage = "Login failed";
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = "Invalid email or password";
        } else if (err.response.status === 429) {
          errorMessage = "Too many login attempts. Please try again later.";
        } else {
          errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
        }
        console.log("Server error details:", err.response.data);
      } else if (err.request) {
        errorMessage = "Network error - please check your connection";
        console.log("Network error:", err.request);
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      setTimeout(() => setError(""), 5000);
      
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMessage = (message) => {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-notification';
    successDiv.innerHTML = `✅ ${message}`;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2 className="login-text">Welcome Back</h2>
        
        {error && (
          <div className="error-message">
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
          />
        </div>
        
        <button 
          type="submit" 
          className={`login-btn ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading-spinner">⏳</span>
              Signing you in...
            </>
          ) : (
            <>
              🚀 Sign In
            </>
          )}
        </button>
        
        <div className="forgot-password">
          <a href="#forgot-password">
            Forgot your password?
          </a>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="debug-info">
            🔧 API URL: {process.env.REACT_APP_API_URL || 'Using default localhost'}
          </div>
        )}
      </form>
    </div>
  );
}

export default Login;
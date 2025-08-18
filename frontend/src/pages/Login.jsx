// src/components/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import '../css/login.css'

console.log("✅ CSS imported");

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      alert("Please enter both email and password");
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

      // ✅ Save token in localStorage
      localStorage.setItem("token", res.data.token);
      
      // ✅ Save user data from login response
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
          // Continue anyway, user data might not be critical for navigation
        }
      }

      alert(res.data.message || "Login successful!");
      navigate("/dashboard");
      
    } catch (err) {
      console.error("❌ Login error:", err);
      
      let errorMessage = "Login failed";
      
      if (err.response) {
        // Server responded with error
        errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
        console.log("Server error details:", err.response.data);
      } else if (err.request) {
        // Network error
        errorMessage = "Network error - please check your connection";
        console.log("Network error:", err.request);
      } else {
        // Other error
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2 className="login-text">Login</h2>
        
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="login-form"
          required
          disabled={loading}
        />
        
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="pass-form"
          required
          disabled={loading}
        />
        
        <button 
          type="submit" 
          className="login-btn"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            API URL: {process.env.REACT_APP_API_URL || 'Using default'}
          </div>
        )}
      </form>
    </div>
  );
}

export default Login;
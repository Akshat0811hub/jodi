import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { checkServerHealth, testAPI } from "../api";
import "../css/login.css";

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  // ✅ Check server health on component mount
  useEffect(() => {
    const checkServer = async () => {
      console.log("🔍 Checking server status...");
      const healthCheck = await checkServerHealth();
      const apiCheck = await testAPI();
      
      if (healthCheck && apiCheck) {
        setServerStatus('online');
        console.log("✅ Server is online and API is working");
      } else {
        setServerStatus('offline');
        console.log("❌ Server appears to be offline");
      }
    };
    
    checkServer();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Form validation
  const validateForm = () => {
    if (!formData.email || !formData.password) {
      alert("Please fill in all required fields");
      return false;
    }
    
    if (!formData.email.includes("@")) {
      alert("Please enter a valid email address");
      return false;
    }
    
    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters long");
      return false;
    }
    
    if (!isLogin && !formData.name) {
      alert("Name is required for registration");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      if (isLogin) {
        console.log("🔐 Attempting login for:", formData.email);
        
        const res = await api.post("/auth/login", {
          email: formData.email.trim(),
          password: formData.password,
        });

        console.log("✅ Login response:", res.data);

        // Store token
        localStorage.setItem("token", res.data.token);

        // Get user profile using the token
        try {
          const profileRes = await api.get("/users/me", {
            headers: {
              Authorization: `Bearer ${res.data.token}`,
            },
          });
          localStorage.setItem("user", JSON.stringify(profileRes.data));
          console.log("✅ User profile loaded:", profileRes.data);
        } catch (profileError) {
          console.warn("⚠️ Could not load user profile, but login successful");
          // If profile fetch fails, use data from login response
          if (res.data.user) {
            localStorage.setItem("user", JSON.stringify(res.data.user));
          }
        }

        alert(res.data.message || "Login successful!");
        navigate("/dashboard");
        
      } else {
        console.log("📝 Attempting registration for:", formData.email);
        
        const res = await api.post("/auth/register", {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        });

        console.log("✅ Registration response:", res.data);
        alert(res.data.message || "Registration successful!");
        
        // Switch to login after successful registration
        setIsLogin(true);
        setFormData({ name: "", email: formData.email, password: "" });
      }
    } catch (err) {
      console.error("❌ Auth error:", err);
      
      let errorMessage = "Something went wrong";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 404) {
        errorMessage = "Server endpoint not found. Please check if the server is running.";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        errorMessage = "Cannot connect to server. Please check if the server is running.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert("Error: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Server status indicator
  const renderServerStatus = () => {
    if (serverStatus === 'checking') {
      return <div style={{color: '#f39c12', marginBottom: '10px'}}>🔍 Checking server...</div>;
    } else if (serverStatus === 'offline') {
      return (
        <div style={{color: '#e74c3c', marginBottom: '10px', textAlign: 'center'}}>
          ❌ Server appears to be offline
          <br />
          <small>Please check if the backend is running</small>
        </div>
      );
    } else {
      return <div style={{color: '#27ae60', marginBottom: '10px'}}>✅ Server online</div>;
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{isLogin ? "Login" : "Register"}</h2>
        
        {/* Server Status */}
        {renderServerStatus()}
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required={!isLogin}
              disabled={loading}
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            minLength="6"
          />

          <button 
            type="submit" 
            disabled={loading || serverStatus === 'offline'}
            style={{
              opacity: (loading || serverStatus === 'offline') ? 0.6 : 1,
              cursor: (loading || serverStatus === 'offline') ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              isLogin ? "Logging in..." : "Registering..."
            ) : (
              isLogin ? "Login" : "Register"
            )}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({ name: "", email: "", password: "" });
              }}
              disabled={loading}
              style={{
                color: "#2980b9",
                background: "none",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "bold",
                textDecoration: "underline"
              }}
            >
              {isLogin ? "Register" : "Login"}
            </button>
          </p>
        </div>
        
        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            marginTop: '20px', 
            padding: '10px', 
            backgroundColor: '#f8f9fa', 
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            <strong>Debug Info:</strong><br />
            API URL: {process.env.REACT_APP_API_URL || "https://jodi-fi4e.onrender.com/api"}<br />
            Server Status: {serverStatus}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthPage;
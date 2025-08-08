import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import '../css/login.css'

console.log("✅ CSS imported");

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { email, password });

      // ✅ Save token in localStorage
      localStorage.setItem("token", res.data.token);

      // ✅ Manually send token in header for immediate profile fetch
      const profileRes = await api.get("/users/me", {
        headers: {
          Authorization: `Bearer ${res.data.token}`,
        },
      });

      // ✅ Save profile in localStorage
      localStorage.setItem("user", JSON.stringify(profileRes.data));

      alert(res.data.message);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      alert("Login failed");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2 className="login-text">Login</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="login-form"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="pass-form"
      />
      <button type="submit" className="login-btn">Login</button>
    </form>
  );
}

export default Login;

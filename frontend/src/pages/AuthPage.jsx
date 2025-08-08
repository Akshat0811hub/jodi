import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../css/login.css"; // ✅ Make sure path and filename are all lowercase

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await api.post("/auth/login", {
          email: formData.email,
          password: formData.password,
        });

        localStorage.setItem("token", res.data.token);

        const profileRes = await api.get("/users/me", {
          headers: {
            Authorization: `Bearer ${res.data.token}`,
          },
        });
        localStorage.setItem("user", JSON.stringify(profileRes.data));

        alert(res.data.message);
        navigate("/dashboard");
      } else {
        const res = await api.post("/auth/register", formData);
        alert(res.data.message);
        setIsLogin(true);
      }
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || "Something went wrong"));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="login-text">{isLogin ? "Login" : "Register"}</h2>

      {!isLogin && (
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="login-form"
        />
      )}

      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        required
        className="login-form"
      />

      <input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        required
        className="pass-form"
      />

      <button type="submit" className="login-btn">
        {isLogin ? "Login" : "Register"}
      </button>

      <p style={{ textAlign: "center", marginTop: "1rem", color: "#2c3e50" }}>
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          style={{
            color: "#2980b9",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {isLogin ? "Register" : "Login"}
        </button>
      </p>
    </form>
  );
}

export default AuthPage;

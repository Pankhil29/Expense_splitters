import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Login = ({ onSwitchToRegister }) => {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Galti! Username ya password check karo.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "420px",
          width: "100%",
          margin: "20px",
          padding: "40px",
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "24px",
          boxShadow:
            "0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.02)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #4f46e5, #6366f1)",
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "24px",
              boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.3)",
            }}
          >
            💸
          </div>
        </div>

        <h2
          style={{
            margin: "0 0 6px 0",
            fontSize: "24px",
            fontWeight: "800",
            color: "#0f172a",
            textAlign: "center",
            letterSpacing: "-0.02em",
          }}
        >
          Welcome Back 👋
        </h2>
        <p
          style={{
            margin: "0 0 28px 0",
            color: "#64748b",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          Apne Splitwise Pro account me login karein
        </p>

        {error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              color: "#991b1b",
              padding: "12px 16px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: "600",
              marginBottom: "20px",
              border: "1px solid #fee2e2",
            }}
          >
            ❌ {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "18px" }}
        >
          <div>
            <label
              style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}
            >
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                marginTop: "6px",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                backgroundColor: "#f8fafc",
                transition: "all 0.2s",
              }}
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label
              style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                marginTop: "6px",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                backgroundColor: "#f8fafc",
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: "#4f46e5",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              marginTop: "8px",
              boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)",
            }}
          >
            {loading ? "Logging in..." : "Sign In"}
          </button>
        </form>

        <p
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontSize: "14px",
            color: "#64748b",
          }}
        >
          Naya account banana hai?{" "}
          <span
            onClick={onSwitchToRegister}
            style={{
              color: "#4f46e5",
              cursor: "pointer",
              fontWeight: "700",
              textDecoration: "none",
            }}
          >
            Create Account
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;

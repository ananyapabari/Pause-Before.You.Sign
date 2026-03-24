import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import { authApi } from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);
      const response = await authApi.login({ email, password });
      localStorage.setItem("pause_token", response.data.token);
      localStorage.setItem("pause_user", JSON.stringify(response.data.user));
      if (response.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-screen">
      <div>
        <AuthCard
          title="Welcome back"
          subtitle="Log in to access your verification dashboard."
        >
          <form className="form-grid" onSubmit={handleSubmit}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {error ? <p className="error-text">{error}</p> : null}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>

            <p className="helper-text">
              <Link to="/forgot-password">Forgot password</Link>
            </p>
            <p className="helper-text">
              Don&apos;t have an account? <Link to="/register">Create one</Link>
            </p>
          </form>
        </AuthCard>
      </div>
    </main>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import { authApi } from "../services/api";
import { validateStrongPassword } from "../utils/passwordValidation";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const passwordRuleError = validateStrongPassword(form.password);
    if (passwordRuleError) {
      setError(passwordRuleError);
      return;
    }

    try {
      setLoading(true);
      await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      navigate("/login");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-screen">
      <div>
        <AuthCard
          title="Create your account"
          subtitle="Your account securely stores your offer checks and history."
        >
          <form className="form-grid" onSubmit={handleSubmit}>
            <label htmlFor="name">Full Name</label>
            <input id="name" name="name" value={form.name} onChange={handleChange} required />

            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />

            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />

            <p className="helper-text">
              Password must be 8+ chars and include uppercase, lowercase, and a number.
            </p>

            {error ? <p className="error-text">{error}</p> : null}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </button>

            <p className="helper-text">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </form>
        </AuthCard>
      </div>
    </main>
  );
}

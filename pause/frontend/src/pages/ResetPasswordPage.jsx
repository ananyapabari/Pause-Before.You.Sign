import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import { authApi } from "../services/api";
import { validateStrongPassword } from "../utils/passwordValidation";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromQuery = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromQuery);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const passwordRuleError = validateStrongPassword(password);
    if (passwordRuleError) {
      setError(passwordRuleError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!token.trim()) {
      setError("Reset token is required.");
      return;
    }

    try {
      setLoading(true);
      await authApi.resetPassword({
        token: token.trim(),
        password,
      });
      setSuccess("Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-screen">
      <div>
        <AuthCard
          title="Reset password"
          subtitle="Create a new strong password for your account."
        >
          <form className="form-grid" onSubmit={handleSubmit}>
            <label htmlFor="reset-token">Reset Token</label>
            <input
              id="reset-token"
              type="text"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              required
            />

            <label htmlFor="new-password">New Password</label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />

            <p className="helper-text">
              Password must be 8+ chars and include uppercase, lowercase, and a number.
            </p>

            {error ? <p className="error-text">{error}</p> : null}
            {success ? <p className="success-text">{success}</p> : null}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Updating..." : "Reset Password"}
            </button>

            <p className="helper-text">
              Back to <Link to="/login">Login</Link>
            </p>
          </form>
        </AuthCard>
      </div>
    </main>
  );
}

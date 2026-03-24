import { useState } from "react";
import { Link } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import { authApi } from "../services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      setLoading(true);
      const response = await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      setSuccess(response.data?.message || "If an account exists, a reset link has been sent.");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to process request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-screen">
      <div>
        <AuthCard
          title="Forgot password"
          subtitle="We will send a secure reset link to your registered email."
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

            {error ? <p className="error-text">{error}</p> : null}
            {success ? <p className="success-text">{success}</p> : null}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
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

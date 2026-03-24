import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import { authApi } from "../services/api";

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateEmail = useMemo(() => location.state?.email || "", [location.state]);

  const [email, setEmail] = useState(stateEmail);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleVerify = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !code.trim()) {
      setError("Email and verification code are required.");
      return;
    }

    try {
      setLoading(true);
      await authApi.verifyCode({
        email: email.trim().toLowerCase(),
        code: code.trim(),
      });
      setSuccess("Email verified. You can now log in.");
      setTimeout(() => navigate("/login"), 1000);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Enter your email to resend the code.");
      return;
    }

    try {
      setResendLoading(true);
      const response = await authApi.resendCode({ email: email.trim().toLowerCase() });
      setSuccess(response.data?.message || "Verification code sent.");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to resend code.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <main className="auth-screen">
      <div>
        <AuthCard
          title="Verify your email"
          subtitle="Enter the 6-digit code we sent to your email address."
        >
          <form className="form-grid" onSubmit={handleVerify}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label htmlFor="code">Verification Code</label>
            <input
              id="code"
              type="text"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              placeholder="6-digit code"
              required
            />

            {error ? <p className="error-text">{error}</p> : null}
            {success ? <p className="success-text">{success}</p> : null}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Verifying..." : "Verify Email"}
            </button>

            <button type="button" className="btn-secondary" onClick={handleResend} disabled={resendLoading}>
              {resendLoading ? "Sending..." : "Resend Code"}
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

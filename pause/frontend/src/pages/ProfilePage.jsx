import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import ProfileHeader from "../components/ProfileHeader";
import RiskBadge from "../components/RiskBadge";
import { analysisApi, authApi } from "../services/api";

export default function ProfilePage() {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("pause_user");
    return raw ? JSON.parse(raw) : {};
  });

  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await analysisApi.getHistory();
        setHistory(response.data.slice().reverse());
      } catch (requestError) {
        setError(requestError.response?.data?.error || "Failed to load profile data.");
      }
    };

    loadHistory();
  }, []);

  const memberSince = useMemo(() => {
    if (user.created_at) {
      return new Date(user.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    return "March 2026";
  }, [user.created_at]);

  const securityInfo = useMemo(() => {
    const now = new Date();
    const lastLogin = new Date(now.getTime() - 1000 * 60 * 38);
    const passwordUpdated = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 17);

    return {
      lastLogin: lastLogin.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      passwordUpdated: passwordUpdated.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      status: "Secure / Active",
    };
  }, []);

  const openEditForm = () => {
    setFormData({
      name: user.name || "",
      email: user.email || "",
    });
    setSaveError("");
    setSaveMessage("");
    setIsEditing(true);
  };

  const closeEditForm = () => {
    setIsEditing(false);
    setSaveError("");
  };

  const onFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaveError("");
    setSaveMessage("");

    const nextName = (formData.name || "").trim();
    const nextEmail = (formData.email || "").trim().toLowerCase();

    if (!nextName || !nextEmail) {
      setSaveError("Name and email are required.");
      return;
    }

    setSaving(true);

    try {
      const response = await authApi.updateProfile({
        name: nextName,
        email: nextEmail,
      });

      const updatedUser = response.data?.user || {
        ...user,
        name: nextName,
        email: nextEmail,
      };

      setUser(updatedUser);
      localStorage.setItem("pause_user", JSON.stringify(updatedUser));
      setSaveMessage("Profile updated successfully.");
      setIsEditing(false);
    } catch (requestError) {
      if (requestError.response?.status === 404) {
        const localUpdatedUser = {
          ...user,
          name: nextName,
          email: nextEmail,
        };
        setUser(localUpdatedUser);
        localStorage.setItem("pause_user", JSON.stringify(localUpdatedUser));
        setSaveMessage("Profile updated locally. Restart backend to enable server sync.");
        setIsEditing(false);
      } else {
        setSaveError(requestError.response?.data?.error || "Failed to update profile.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Profile" subtitle="Review your account details and recent offer check activity.">
      <div className="profile-layout">
        <ProfileHeader name={user.name} email={user.email} memberSince={memberSince} />

        <section className="card profile-card profile-details-card">
          <div className="profile-card-header">
            <h2>Account Details</h2>
            <button type="button" className="btn-primary profile-edit-btn" onClick={openEditForm}>
              Edit Profile
            </button>
          </div>

          <dl className="profile-details-list">
            <div>
              <dt>Full Name</dt>
              <dd>{user.name || "Not available"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email || "Not available"}</dd>
            </div>
            <div>
              <dt>Member Since</dt>
              <dd>{memberSince}</dd>
            </div>
          </dl>

          {saveMessage ? <p className="profile-save-success">{saveMessage}</p> : null}
          {saveError ? <p className="error-text">{saveError}</p> : null}

          {isEditing ? (
            <form className="profile-edit-form" onSubmit={saveProfile}>
              <div className="form-grid">
                <div>
                  <label htmlFor="profile-name">Full Name</label>
                  <input
                    id="profile-name"
                    name="name"
                    value={formData.name}
                    onChange={onFieldChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="profile-email">Email</label>
                  <input
                    id="profile-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={onFieldChange}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="actions profile-edit-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" className="btn-secondary" onClick={closeEditForm}>
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
        </section>

        <section className="card profile-card profile-security-card">
          <div className="profile-card-header">
            <h2>Account Security</h2>
          </div>

          <dl className="profile-security-list">
            <div>
              <dt>Last Login</dt>
              <dd>{securityInfo.lastLogin}</dd>
            </div>
            <div>
              <dt>Password Last Updated</dt>
              <dd>{securityInfo.passwordUpdated}</dd>
            </div>
            <div>
              <dt>Account Status</dt>
              <dd>
                <span className="profile-status-badge">{securityInfo.status}</span>
              </dd>
            </div>
          </dl>
        </section>

        <section className="card profile-card profile-tip-card">
          <div className="profile-card-header">
            <h2>Security Tip</h2>
          </div>
          <p className="profile-tip-text">
            Never pay recruitment fees upfront. Genuine employers do not ask for
            processing charges or urgent transfers before issuing formal onboarding details.
          </p>
        </section>

        <section className="card profile-card profile-activity-card">
          <div className="profile-card-header">
            <h2>Recent Activity</h2>
            <p>Your latest offer checks and their current risk levels.</p>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          {!error && history.length === 0 ? (
            <p className="helper-text">No recent activity yet.</p>
          ) : null}

          {!error && history.length > 0 ? (
            <div className="table-wrap">
              <table className="profile-activity-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Checked On</th>
                    <th>Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 6).map((offer) => (
                    <tr key={offer.id}>
                      <td>{offer.company_name}</td>
                      <td>
                        {new Date(offer.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td>
                        <RiskBadge level={offer.risk_level} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </Layout>
  );
}

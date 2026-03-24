import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { adminApi } from "../services/api";

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      role: role === "all" ? undefined : role,
      status: status === "all" ? undefined : status,
    }),
    [search, role, status]
  );

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await adminApi.getUsers(query);
      setUsers(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [query]);

  const toggleStatus = async (user) => {
    try {
      await adminApi.updateUserStatus(user.id, { is_active: !user.is_active });
      await loadUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to update status.");
    }
  };

  const toggleRole = async (user) => {
    try {
      const nextRole = user.role === "admin" ? "user" : "admin";
      await adminApi.updateUserRole(user.id, { role: nextRole });
      await loadUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to update role.");
    }
  };

  const removeUser = async (user) => {
    const confirmed = window.confirm(`Delete user ${user.email}? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      await adminApi.deleteUser(user.id);
      await loadUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to delete user.");
    }
  };

  return (
    <Layout title="Users Management" subtitle="Manage accounts, access levels, and user status.">
      <header className="topbar">
        <Link className="btn-secondary" to="/admin">
          Back to Admin
        </Link>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <section className="card panel">
        <div className="filters-row">
          <input
            type="search"
            placeholder="Search by email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="all">All roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
          <button type="button" className="btn-secondary" onClick={loadUsers}>
            Refresh
          </button>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Verification</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role === "admin" ? "Admin" : "User"}</td>
                  <td>{user.is_verified ? "Verified" : "Unverified"}</td>
                  <td>{user.is_active ? "Active" : "Disabled"}</td>
                  <td>{new Date(user.created_at).toLocaleString()}</td>
                  <td>
                    <div className="actions actions-compact">
                      <button type="button" className="btn-secondary" onClick={() => toggleStatus(user)}>
                        {user.is_active ? "Disable" : "Enable"}
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => toggleRole(user)}>
                        {user.role === "admin" ? "Demote" : "Promote"}
                      </button>
                      <button type="button" className="btn-danger" onClick={() => removeUser(user)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading ? <p className="helper">Loading users...</p> : null}
        {!loading && users.length === 0 ? <p className="helper">No users found for current filters.</p> : null}
      </section>
    </Layout>
  );
}
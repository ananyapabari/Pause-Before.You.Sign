import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { adminApi } from "../services/api";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const response = await adminApi.getLogs();
        setLogs(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.error || "Failed to load audit logs.");
      }
    };

    loadLogs();
  }, []);

  return (
    <Layout title="Audit Logs" subtitle="Track administrative rule and system actions.">
      <header className="topbar">
        <Link className="btn-secondary" to="/admin">
          Back to Admin
        </Link>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Admin Name</th>
              <th>Action</th>
              <th>Target</th>
              <th>Details</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.admin_name}</td>
                <td>{log.action}</td>
                <td>
                  {log.target_type}: {log.target}
                </td>
                <td>{log.details || "-"}</td>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Layout>
  );
}

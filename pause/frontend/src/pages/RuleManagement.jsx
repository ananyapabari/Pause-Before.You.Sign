import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { adminApi } from "../services/api";

export default function RuleManagement() {
  const [rules, setRules] = useState([]);
  const [error, setError] = useState("");

  const loadRules = async () => {
    try {
      const response = await adminApi.getRules();
      setRules(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to load rules.");
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const updateRule = async (ruleName, field, value) => {
    try {
      await adminApi.updateRule(ruleName, { [field]: value });
      await loadRules();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to update rule.");
    }
  };

  return (
    <Layout title="Rule Management" subtitle="Manage risk scoring rule weights and activation.">
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
              <th>Rule Name</th>
              <th>Description</th>
              <th>Weight</th>
              <th>Enabled</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td>{rule.rule_name}</td>
                <td>{rule.description}</td>
                <td>
                  <div className="rule-weight-cell">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={rule.weight}
                      onChange={(event) =>
                        setRules((prev) =>
                          prev.map((item) =>
                            item.id === rule.id ? { ...item, weight: Number(event.target.value) } : item
                          )
                        )
                      }
                      onMouseUp={() => updateRule(rule.rule_name, "weight", rule.weight)}
                      onTouchEnd={() => updateRule(rule.rule_name, "weight", rule.weight)}
                    />
                    <span>{rule.weight}</span>
                  </div>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => updateRule(rule.rule_name, "enabled", !rule.enabled)}
                  >
                    {rule.enabled ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Layout>
  );
}

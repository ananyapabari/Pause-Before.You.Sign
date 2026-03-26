import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import OfferForm from "../components/OfferForm";
import { analysisApi } from "../services/api";

export default function NewOfferPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (form) => {
    setError("");

    try {
      setLoading(true);
      const response = await analysisApi.analyzeOffer(form);
      navigate("/result", {
        state: {
          result: response.data,
          companyName: form.companyName,
          analyzedForm: form,
        },
      });
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to analyze offer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout
      title="New Offer Check"
      subtitle="Submit offer details to run a risk assessment before taking action."
    >
      <section className="card panel form-panel">
        {error ? <p className="error-text">{error}</p> : null}
        <OfferForm onSubmit={handleSubmit} loading={loading} />
      </section>
    </Layout>
  );
}

import { useState } from "react";

const INITIAL_FORM = {
  companyName: "",
  jobDescription: "",
  recruiterEmail: "",
  companyWebsite: "",
};

export default function OfferForm({ onSubmit, loading }) {
  const [form, setForm] = useState(INITIAL_FORM);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label htmlFor="companyName">Company Name</label>
      <input
        id="companyName"
        name="companyName"
        value={form.companyName}
        onChange={handleChange}
        required
      />

      <label htmlFor="jobDescription">Job Description</label>
      <textarea
        id="jobDescription"
        name="jobDescription"
        value={form.jobDescription}
        onChange={handleChange}
        rows={10}
        required
      />

      <label htmlFor="recruiterEmail">Recruiter Email</label>
      <input
        id="recruiterEmail"
        type="email"
        name="recruiterEmail"
        value={form.recruiterEmail}
        onChange={handleChange}
        required
      />

      <label htmlFor="companyWebsite">Company Website</label>
      <input
        id="companyWebsite"
        name="companyWebsite"
        placeholder="https://example.com"
        value={form.companyWebsite}
        onChange={handleChange}
        required
      />

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Analyzing..." : "Analyze Offer"}
      </button>
    </form>
  );
}

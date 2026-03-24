import RiskBadge from "./RiskBadge";

export default function OfferTable({ items }) {
  if (!items?.length) {
    return <p className="helper-text">No offer checks available yet.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Date</th>
            <th>Risk Level</th>
          </tr>
        </thead>
        <tbody>
          {items.map((offer) => (
            <tr key={offer.id}>
              <td>{offer.company_name}</td>
              <td>{new Date(offer.created_at).toLocaleString()}</td>
              <td>
                <RiskBadge level={offer.risk_level} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

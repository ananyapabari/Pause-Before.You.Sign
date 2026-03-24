export default function ProfileHeader({ name, email, memberSince }) {
  const safeName = name?.trim() || "Pause User";
  const initials = safeName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "PU";

  return (
    <section className="card profile-header-card" aria-label="Profile header">
      <div className="profile-header-inner">
        <div className="profile-avatar" aria-hidden="true">
          {initials}
        </div>
        <div className="profile-header-copy">
          <p className="profile-section-label">Account Profile</p>
          <h2 className="profile-name">{safeName}</h2>
          <p className="profile-email">{email || "No email available"}</p>
          <p className="profile-member-since">Member since {memberSince}</p>
        </div>
      </div>
    </section>
  );
}

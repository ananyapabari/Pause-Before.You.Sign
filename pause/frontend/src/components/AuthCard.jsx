import AppLogo from "./AppLogo";

export default function AuthCard({ title, subtitle, children }) {
  return (
    <section className="auth-card" aria-label={title}>
      <div className="auth-card-brand">
        <AppLogo className="auth-card-logo" />
      </div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {children}
    </section>
  );
}

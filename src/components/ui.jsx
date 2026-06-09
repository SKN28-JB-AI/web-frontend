// 작은 공용 UI 조각들.
export function StatusPill({ status }) {
  const map = {
    completed: "ok",
    succeeded: "ok",
    in_progress: "run",
    running: "run",
    pending: "idle",
    queued: "idle",
    failed: "err",
    partial: "warn",
  };
  const cls = map[status] || "idle";
  return <span className={"pill pill-" + cls}>{status}</span>;
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-head-actions">{actions}</div>}
    </header>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint muted">{hint}</span>}
    </label>
  );
}

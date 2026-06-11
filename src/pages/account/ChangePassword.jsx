// 본인 비밀번호 변경 페이지.
// auth-server POST /me/password 사용 — 현재 비밀번호 확인 후 변경.
// 성공 시 다른 기기/세션의 refresh token 이 모두 폐기된다(서버 동작).
import { useState } from "react";
import { useAuth } from "../../auth/AuthContext.jsx";
import { AUTH_BASE } from "../../config.js";
import { PageHeader, Field } from "../../components/ui.jsx";

export default function ChangePassword() {
  const { authFetch } = useAuth();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (form.next.length < 8) {
      setError("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (form.next !== form.confirm) {
      setError("새 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    if (form.next === form.current) {
      setError("새 비밀번호는 현재 비밀번호와 달라야 합니다.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch(AUTH_BASE + "/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: form.current,
          new_password: form.next,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.error_description || data?.error || "HTTP " + res.status
        );
      }
      setDone(true);
      setForm({ current: "", next: "", confirm: "" });
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="비밀번호 변경"
        subtitle="현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다."
      />
      {error && <div className="alert err">{error}</div>}
      {done && (
        <div className="alert ok">
          비밀번호가 변경되었습니다. 다른 기기의 로그인은 자동으로 해제됩니다.
        </div>
      )}
      <form className="card form" onSubmit={submit} style={{ maxWidth: 420 }}>
        <Field label="현재 비밀번호">
          <input
            type="password"
            required
            autoComplete="current-password"
            value={form.current}
            onChange={set("current")}
          />
        </Field>
        <Field label="새 비밀번호" hint="8자 이상">
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.next}
            onChange={set("next")}
          />
        </Field>
        <Field label="새 비밀번호 확인">
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.confirm}
            onChange={set("confirm")}
          />
        </Field>
        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? "변경 중…" : "비밀번호 변경"}
        </button>
      </form>
    </div>
  );
}

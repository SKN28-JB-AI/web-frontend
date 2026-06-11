// 관리자 전용 — 사용자 등록/변경/삭제 + 쿠폰(잔여 횟수) 발급.
// auth-server /admin/users API 사용. 관리자가 아니면 홈으로 돌려보낸다.
import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../auth/AuthContext.jsx";
import { AUTH_BASE } from "../../config.js";
import { PageHeader, Field } from "../../components/ui.jsx";

const EMPTY_CREATE = {
  username: "",
  password: "",
  display_name: "",
  email: "",
  video_coupons: 0,
  ad_coupons: 0,
};

async function errOf(res) {
  try {
    const d = await res.json();
    return d.error_description || d.error || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export default function AdminUsers() {
  const { user, authFetch } = useAuth();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState(EMPTY_CREATE);
  const [editingId, setEditingId] = useState(null);
  const [edit, setEdit] = useState({});

  const load = useCallback(async () => {
    setError(null);
    const res = await authFetch(AUTH_BASE + "/admin/users");
    if (!res.ok) {
      setError(await errOf(res));
      return;
    }
    const data = await res.json();
    setUsers(data.users || []);
  }, [authFetch]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  if (!user?.admin) return <Navigate to="/" replace />;

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2500);
  };

  // ── 등록 ──────────────────────────────────────────────────────────
  const createUser = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await authFetch(AUTH_BASE + "/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          video_coupons: Number(form.video_coupons) || 0,
          ad_coupons: Number(form.ad_coupons) || 0,
        }),
      });
      if (!res.ok) throw new Error(await errOf(res));
      setForm(EMPTY_CREATE);
      flash("사용자가 등록되었습니다.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  // ── 수정 ──────────────────────────────────────────────────────────
  const startEdit = (u) => {
    setEditingId(u.id);
    setEdit({
      display_name: u.display_name,
      email: u.email || "",
      password: "",
      video_coupons: u.video_coupons,
      ad_coupons: u.ad_coupons,
    });
  };

  const saveEdit = async (u) => {
    setError(null);
    setBusy(true);
    try {
      const body = {
        display_name: edit.display_name,
        email: edit.email,
        video_coupons: Number(edit.video_coupons) || 0,
        ad_coupons: Number(edit.ad_coupons) || 0,
      };
      if (edit.password) body.password = edit.password;
      const res = await authFetch(AUTH_BASE + "/admin/users/" + u.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await errOf(res));
      setEditingId(null);
      flash("저장되었습니다.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  // ── 삭제 ──────────────────────────────────────────────────────────
  const removeUser = async (u) => {
    if (!window.confirm(`'${u.username}' 사용자를 삭제할까요? 되돌릴 수 없습니다.`)) return;
    setError(null);
    setBusy(true);
    try {
      const res = await authFetch(AUTH_BASE + "/admin/users/" + u.id, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) throw new Error(await errOf(res));
      flash("삭제되었습니다.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const num = (v) => (v === "" ? "" : Math.max(0, Number(v)));

  return (
    <div className="page">
      <PageHeader
        title="사용자 관리"
        subtitle="사용자 등록·변경·삭제와 기능별 쿠폰(잔여 횟수) 발급 — 관리자 전용"
      />

      {error && <div className="alert err">{error}</div>}
      {notice && <div className="alert info">{notice}</div>}

      {/* ── 신규 등록 ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <form className="form" onSubmit={createUser}>
          <div className="form-row">
            <Field label="아이디 *">
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoComplete="off"
                required
              />
            </Field>
            <Field label="비밀번호 *" hint="8자 이상">
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </Field>
            <Field label="표시 이름">
              <input
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              />
            </Field>
          </div>
          <div className="form-row">
            <Field label="이메일">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="영상 생성 쿠폰">
              <input
                type="number"
                min="0"
                value={form.video_coupons}
                onChange={(e) => setForm({ ...form, video_coupons: num(e.target.value) })}
              />
            </Field>
            <Field label="광고 파이프라인 쿠폰">
              <input
                type="number"
                min="0"
                value={form.ad_coupons}
                onChange={(e) => setForm({ ...form, ad_coupons: num(e.target.value) })}
              />
            </Field>
          </div>
          <div className="row">
            <button className="btn btn-primary" disabled={busy}>
              사용자 등록
            </button>
          </div>
        </form>
      </div>

      {/* ── 목록 ── */}
      {users === null ? (
        <p className="muted">불러오는 중…</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>아이디</th>
                <th>표시 이름</th>
                <th>이메일</th>
                <th>영상 쿠폰</th>
                <th>광고 쿠폰</th>
                <th style={{ width: 170 }}></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) =>
                editingId === u.id ? (
                  <tr key={u.id}>
                    <td className="mono">{u.username}</td>
                    <td>
                      <input
                        value={edit.display_name}
                        onChange={(e) => setEdit({ ...edit, display_name: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="email"
                        value={edit.email}
                        onChange={(e) => setEdit({ ...edit, email: e.target.value })}
                      />
                      <input
                        type="password"
                        placeholder="새 비밀번호 (선택)"
                        value={edit.password}
                        onChange={(e) => setEdit({ ...edit, password: e.target.value })}
                        autoComplete="new-password"
                        style={{ marginTop: 6 }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        style={{ width: 80 }}
                        value={edit.video_coupons}
                        onChange={(e) => setEdit({ ...edit, video_coupons: num(e.target.value) })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        style={{ width: 80 }}
                        value={edit.ad_coupons}
                        onChange={(e) => setEdit({ ...edit, ad_coupons: num(e.target.value) })}
                      />
                    </td>
                    <td>
                      <div className="row" style={{ marginTop: 0 }}>
                        <button className="btn btn-primary" disabled={busy} onClick={() => saveEdit(u)}>
                          저장
                        </button>
                        <button className="btn" onClick={() => setEditingId(null)}>
                          취소
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={u.id}>
                    <td className="mono">
                      {u.username}
                      {u.is_admin && <span className="badge" style={{ marginLeft: 6 }}>관리자</span>}
                    </td>
                    <td>{u.display_name || "—"}</td>
                    <td>{u.email || "—"}</td>
                    <td>{u.is_admin ? "무제한" : u.video_coupons}</td>
                    <td>{u.is_admin ? "무제한" : u.ad_coupons}</td>
                    <td>
                      <div className="row" style={{ marginTop: 0 }}>
                        <button className="btn" onClick={() => startEdit(u)}>
                          수정
                        </button>
                        {u.id !== user.sub && (
                          <button className="btn" disabled={busy} onClick={() => removeUser(u)}>
                            삭제
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted small" style={{ marginTop: 10 }}>
        쿠폰 발급 = 잔여 수를 직접 수정합니다. 영상 생성(메시지/PDF/리믹스)과 광고
        파이프라인 시작 시 1개씩 차감되며, 관리자 계정은 차감 없이 무제한입니다.
      </p>
    </div>
  );
}

import { NavLink, Outlet } from "react-router";
import { useAuth } from "../auth/AuthContext.jsx";

const MENU = [
  {
    group: "Multi-Modal Agent",
    items: [
      { to: "/mma/videos", label: "영상 생성" },
      { to: "/mma/jobs", label: "영상 작업 목록" },
      { to: "/mma/ads", label: "광고 파이프라인" },
    ],
  },
  {
    group: "Translation Agent",
    items: [{ to: "/translation", label: "다국어 변환", soon: true }],
  },
  {
    group: "Content Recommendation",
    items: [{ to: "/recommendation", label: "콘텐츠 추천", soon: true }],
  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">JB</span>
          <span className="brand-text">AI 마케팅 플랫폼</span>
        </div>
        <nav className="nav">
          {MENU.map((g) => (
            <div className="nav-group" key={g.group}>
              <div className="nav-group-title">{g.group}</div>
              {g.items.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  className={({ isActive }) =>
                    "nav-link" + (isActive ? " active" : "")
                  }
                >
                  <span>{it.label}</span>
                  {it.soon && <span className="badge">준비중</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="user">
            <div className="user-name">{user?.name || user?.username || "사용자"}</div>
            <div className="user-sub muted">{user?.username}</div>
          </div>
          <button className="btn btn-ghost" onClick={logout}>
            로그아웃
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

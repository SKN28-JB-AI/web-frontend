import { Navigate, useLocation } from "react-router";
import { useAuth } from "../auth/AuthContext.jsx";

// 인증된 사용자만 통과. 부트스트랩 중에는 로딩 표시.
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, ready } = useAuth();
  const location = useLocation();
  if (!ready) {
    return <div className="centered muted">세션 확인 중…</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

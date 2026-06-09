import { Navigate } from "react-router";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Login() {
  const { login, isAuthenticated, ready } = useAuth();
  if (ready && isAuthenticated) return <Navigate to="/" replace />;
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand brand-lg">
          <span className="brand-mark">JB</span>
          <span className="brand-text">AI 마케팅 플랫폼</span>
        </div>
        <p className="muted">
          JB금융그룹 멀티-에이전트 마케팅 자동화 콘솔입니다.
          계속하려면 통합 인증으로 로그인하세요.
        </p>
        <button className="btn btn-primary btn-block" onClick={login}>
          OAuth 2.1 로그인
        </button>
        <p className="login-hint muted">
          인증서버(auth-server)의 Authorization Code + PKCE 흐름으로 로그인합니다.
        </p>
      </div>
    </div>
  );
}

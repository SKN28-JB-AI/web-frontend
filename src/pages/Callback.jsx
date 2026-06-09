import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Callback() {
  const { handleCallback } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const once = useRef(false);

  useEffect(() => {
    if (once.current) return; // StrictMode 이중 실행 방지
    once.current = true;
    handleCallback(params)
      .then(() => navigate("/", { replace: true }))
      .catch((e) => setError(e.message));
  }, [handleCallback, params, navigate]);

  if (error) {
    return (
      <div className="centered">
        <div className="login-card">
          <h2>로그인 실패</h2>
          <p className="err">{error}</p>
          <button className="btn" onClick={() => navigate("/login", { replace: true })}>
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }
  return <div className="centered muted">로그인 처리 중…</div>;
}

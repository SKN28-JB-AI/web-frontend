// 런타임 설정 — .env(VITE_*) 우선, 미설정 시 로컬 개발 기본값.
export const AUTH_BASE =
  import.meta.env.VITE_AUTH_BASE || "http://localhost:9000";
export const MMA_BASE =
  import.meta.env.VITE_MMA_BASE || "http://localhost:8000";
export const CLIENT_ID =
  import.meta.env.VITE_OAUTH_CLIENT_ID || "frontend-spa";
export const SCOPE =
  import.meta.env.VITE_OAUTH_SCOPE || "openid profile api";

// auth-server 시드의 redirect_uri 와 정확히 일치해야 한다.
export const REDIRECT_URI = window.location.origin + "/callback";

// 런타임 설정 — 우선순위: window.__ENV__(컨테이너 시작 시 생성되는 /env.js)
//             > 빌드타임 VITE_*(.env) > 로컬 개발 기본값.
//
// window.__ENV__ 는 nginx 컨테이너의 entrypoint(docker/40-env.sh)가
// 컨테이너 환경변수(AUTH_BASE/MMA_BASE 등)로부터 생성한다.
// → 이미지 재빌드 없이 배포 환경(예: Cloudflare Quick Tunnel)마다 주소 변경 가능.
//
// AUTH_BASE / MMA_BASE 해석 규칙:
//   - 미설정         → 로컬 개발 기본값(localhost:9000 / :8000)
//   - "http..."(절대) → 그 값을 그대로 사용 (서브도메인/별도 호스트 배포)
//   - "/oauth" 등 상대 → window.location.origin 에 붙여 "동일 출처"로 사용
//     (Quick Tunnel처럼 외부 URL이 매번 바뀌어도 빌드/재기동 불필요)
const RT = (typeof window !== "undefined" && window.__ENV__) || {};

function resolveBase(v, fallback) {
  if (!v) return fallback;
  if (/^https?:\/\//i.test(v)) return v;
  return window.location.origin + (v.startsWith("/") ? v : "/" + v);
}

export const AUTH_BASE = resolveBase(
  RT.AUTH_BASE || import.meta.env.VITE_AUTH_BASE,
  "http://localhost:9000"
);
export const MMA_BASE = resolveBase(
  RT.MMA_BASE || import.meta.env.VITE_MMA_BASE,
  "http://localhost:8000"
);
export const CLIENT_ID =
  RT.CLIENT_ID || import.meta.env.VITE_OAUTH_CLIENT_ID || "frontend-spa";
export const SCOPE =
  RT.SCOPE || import.meta.env.VITE_OAUTH_SCOPE || "openid profile api";

// auth-server 시드의 redirect_uri 와 정확히 일치해야 한다.
export const REDIRECT_URI = window.location.origin + "/callback";

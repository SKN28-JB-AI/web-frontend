#!/bin/sh
# nginx 컨테이너 시작 시 런타임 설정(env.js) 생성.
# AUTH_BASE/MMA_BASE 가 "/oauth", "/api" 같은 상대경로면 SPA 가 동일 출처로 호출
# → Cloudflare Quick Tunnel 처럼 외부 URL 을 미리 알 수 없어도 동작한다.
set -e
OUT=/usr/share/nginx/html/env.js
{
  echo "// generated at container start by 40-env.sh"
  echo "window.__ENV__ = {"
  [ -n "${AUTH_BASE:-}" ]       && echo "  AUTH_BASE: \"${AUTH_BASE}\","
  [ -n "${MMA_BASE:-}" ]        && echo "  MMA_BASE: \"${MMA_BASE}\","
  [ -n "${OAUTH_CLIENT_ID:-}" ] && echo "  CLIENT_ID: \"${OAUTH_CLIENT_ID}\","
  [ -n "${OAUTH_SCOPE:-}" ]     && echo "  SCOPE: \"${OAUTH_SCOPE}\","
  echo "};"
} > "$OUT"
echo "[40-env.sh] generated $OUT:" && cat "$OUT"

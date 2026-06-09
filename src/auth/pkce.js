// OAuth 2.1 PKCE(S256) 헬퍼 — Web Crypto 기반.
// auth-server/examples/frontend/index.html 의 구현을 모듈화한 것.

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// 43~128자 랜덤 verifier (32바이트 → base64url ≈ 43자)
export function randomString() {
  const a = new Uint8Array(32);
  crypto.getRandomValues(a);
  return b64url(a);
}

export async function challengeOf(verifier) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  return b64url(digest);
}

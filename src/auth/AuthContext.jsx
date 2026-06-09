import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AUTH_BASE, MMA_BASE, CLIENT_ID, SCOPE, REDIRECT_URI } from "../config.js";
import { randomString, challengeOf } from "./pkce.js";

const LS_ACCESS = "jbfg_access_token";
const LS_REFRESH = "jbfg_refresh_token";
const SS_VERIFIER = "jbfg_pkce_verifier";
const SS_STATE = "jbfg_oauth_state";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  // 토큰은 ref 로도 들고 있어 authFetch 클로저가 항상 최신값을 본다.
  const tokens = useRef({
    access: localStorage.getItem(LS_ACCESS),
    refresh: localStorage.getItem(LS_REFRESH),
  });

  const setTokens = useCallback((access, refresh) => {
    tokens.current = { access, refresh };
    if (access) localStorage.setItem(LS_ACCESS, access);
    else localStorage.removeItem(LS_ACCESS);
    if (refresh) localStorage.setItem(LS_REFRESH, refresh);
    else localStorage.removeItem(LS_REFRESH);
  }, []);

  const clearAuth = useCallback(() => {
    setTokens(null, null);
    setUser(null);
  }, [setTokens]);

  // ── 사용자 정보 조회 (/userinfo) ──────────────────────────────────
  const fetchUserInfo = useCallback(async (access) => {
    const res = await fetch(AUTH_BASE + "/userinfo", {
      headers: { Authorization: "Bearer " + access },
    });
    if (!res.ok) throw new Error("userinfo " + res.status);
    return res.json();
  }, []);

  // ── 리프레시 토큰 회전 ───────────────────────────────────────────
  const refresh = useCallback(async () => {
    const rt = tokens.current.refresh;
    if (!rt) throw new Error("no refresh token");
    const res = await fetch(AUTH_BASE + "/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: rt,
        client_id: CLIENT_ID,
      }),
    });
    if (!res.ok) {
      clearAuth();
      throw new Error("refresh failed " + res.status);
    }
    const t = await res.json();
    setTokens(t.access_token, t.refresh_token || rt);
    return t.access_token;
  }, [clearAuth, setTokens]);

  // ── 로그인 시작: verifier 생성 → /authorize 이동 ──────────────────
  const login = useCallback(async () => {
    const verifier = randomString();
    const state = randomString();
    sessionStorage.setItem(SS_VERIFIER, verifier);
    sessionStorage.setItem(SS_STATE, state);
    const challenge = await challengeOf(verifier);
    const url = new URL(AUTH_BASE + "/authorize");
    url.search = new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPE,
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    }).toString();
    window.location.href = url.toString();
  }, []);

  // ── 콜백 처리: code → /token 교환 ────────────────────────────────
  const handleCallback = useCallback(
    async (params) => {
      if (params.get("error")) {
        throw new Error(
          params.get("error") + ": " + (params.get("error_description") || "")
        );
      }
      const code = params.get("code");
      if (!code) throw new Error("인가 코드가 없습니다.");
      if (params.get("state") !== sessionStorage.getItem(SS_STATE)) {
        throw new Error("state 불일치 — CSRF 가 의심됩니다.");
      }
      const verifier = sessionStorage.getItem(SS_VERIFIER);
      const res = await fetch(AUTH_BASE + "/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID,
          code_verifier: verifier,
        }),
      });
      const t = await res.json();
      if (!res.ok) {
        throw new Error(t.error_description || t.error || "토큰 교환 실패");
      }
      sessionStorage.removeItem(SS_VERIFIER);
      sessionStorage.removeItem(SS_STATE);
      setTokens(t.access_token, t.refresh_token);
      const info = await fetchUserInfo(t.access_token);
      setUser(info);
    },
    [fetchUserInfo, setTokens]
  );

  const logout = useCallback(() => {
    clearAuth();
    window.location.href = "/login";
  }, [clearAuth]);

  // ── 인증 fetch: MMA API 호출 + 401 시 1회 자동 리프레시 후 재시도 ──
  const authFetch = useCallback(
    async (path, opts = {}) => {
      const url = path.startsWith("http") ? path : MMA_BASE + path;
      const doFetch = (access) => {
        const headers = new Headers(opts.headers || {});
        if (access) headers.set("Authorization", "Bearer " + access);
        return fetch(url, { ...opts, headers });
      };
      let res = await doFetch(tokens.current.access);
      if (res.status === 401 && tokens.current.refresh) {
        try {
          const newAccess = await refresh();
          res = await doFetch(newAccess);
        } catch {
          /* refresh 실패 시 원래 401 그대로 반환 */
        }
      }
      return res;
    },
    [refresh]
  );

  // ── 부트스트랩: 저장된 토큰으로 세션 복원 ─────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      const access = tokens.current.access;
      if (!access) {
        setReady(true);
        return;
      }
      try {
        const info = await fetchUserInfo(access);
        if (alive) setUser(info);
      } catch {
        try {
          const newAccess = await refresh();
          const info = await fetchUserInfo(newAccess);
          if (alive) setUser(info);
        } catch {
          if (alive) clearAuth();
        }
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [fetchUserInfo, refresh, clearAuth]);

  const value = {
    user,
    ready,
    isAuthenticated: !!user,
    login,
    logout,
    handleCallback,
    authFetch,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

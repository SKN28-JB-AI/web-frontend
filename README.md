# JB금융그룹 AI 마케팅 플랫폼 — 웹 프론트엔드

React + Vite 기반 SPA. **auth-server(OAuth 2.1 + PKCE)** 로 로그인하고,
**multi_modal_agent** API 를 호출해 광고 영상을 생성/관리한다.
다국어 변환·콘텐츠 추천 에이전트는 메뉴와 빈 프롬프트 페이지만 준비되어 있다(백엔드 미구현).

## 기술 스택

- React 18 + Vite 6
- React Router v7 (library mode, `createBrowserRouter` + `RouterProvider`)
- 순수 CSS (단일 `src/styles.css`)
- 인증: OAuth 2.1 Authorization Code + PKCE(S256), Web Crypto

> CLAUDE.md §3 에 따라 React Router 의 라우터 구성 패턴은 Context7 로 검증했다.

## 사전 조건 (백엔드 기동)

```bash
# 1) 인증서버 (포트 9000)
cd ../auth-server && docker compose up --build

# 2) multi_modal_agent (포트 8000)
cd ../multi_modal_agent && python run.py
```

multi_modal_agent 가 JWT 를 검증하려면 `.env` 에 다음이 설정되어야 한다:

```
AUTH_ISSUER=http://localhost:9000
AUTH_REQUIRED_SCOPE=api
CORS_ORIGINS=http://localhost:5173
```

auth-server 시드(`db/init.sql`)에는 이미 `frontend-spa` public 클라이언트와
`http://localhost:5173/callback` redirect_uri, 데모 계정 `demo / password123` 이 등록되어 있다.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173 (포트 고정)
```

> 개발 서버 포트는 **5173 고정**이다. redirect_uri 가 시드와 정확히 일치해야 하기 때문.

빌드:

```bash
npm run build      # dist/
npm run preview
```

## 환경변수 (`.env`, 선택)

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `VITE_AUTH_BASE` | `http://localhost:9000` | 인증서버 외부 URL |
| `VITE_MMA_BASE` | `http://localhost:8000` | multi_modal_agent API |
| `VITE_OAUTH_CLIENT_ID` | `frontend-spa` | public 클라이언트 ID |
| `VITE_OAUTH_SCOPE` | `openid profile api` | 요청 스코프 |

`.env.example` 참고. redirect_uri 는 `window.location.origin + /callback` 로 자동 산출된다.

## 라우트

| 경로 | 화면 |
|------|------|
| `/login`, `/callback` | 로그인 / OAuth 콜백 |
| `/` | 홈(기능 카드) |
| `/mma/videos` | 영상 생성 — 메시지 / PDF 모드 (`POST /v1/videos/*`) |
| `/mma/jobs` | 영상 잡 목록 (`GET /v1/jobs`, 5초 폴링) |
| `/mma/jobs/:id` | 잡 상세 — 스토리보드·씬·결과 영상 (`GET /v1/jobs/{id}`) |
| `/mma/ads` | 광고 파이프라인 목록 (`GET /v2/ads`) |
| `/mma/ads/new` | 스토리보드 생성 프롬프트 (`POST /v2/ads/storyboards`) |
| `/mma/ads/:id` | 4단계 순차 파이프라인 + 단계별 산출물 확인 |
| `/translation` | 다국어 변환 (준비 중 · 빈 프롬프트) |
| `/recommendation` | 콘텐츠 추천 (준비 중 · 빈 프롬프트) |

### 광고 파이프라인(`/mma/ads/:id`) 단계 게이팅

1. **스토리보드** → 2. **컷 이미지** → 3. **컷 비디오 + 결합** → 4. **기획서 PDF**

- 3단계(비디오)는 2단계(이미지) 완료 후에만 실행 가능(서버 412 게이팅을 UI 에서도 비활성으로 반영).
- 4단계(PDF)는 1단계만 완료되면 실행 가능(이미지/비디오와 무관).
- 완료된 단계는 `?force=true` 로 재실행할 수 있다.
- 진행 중 단계가 있으면 4초마다 자동 폴링한다.

## 인증 동작

- 토큰은 `localStorage`(access/refresh)에 보관, PKCE verifier·state 는 `sessionStorage`.
- API 호출은 `Authorization: Bearer <access_token>` 부착. 401 시 refresh_token 으로 1회 자동 회전 후 재시도.
- Bearer 인증이 필요한 미디어(이미지/영상/PDF)는 `fetch` 로 blob 을 받아 objectURL 로 렌더링·다운로드한다.

## 디렉토리

```
web-frontend/
├── src/
│   ├── config.js            # API 베이스 URL / 클라이언트 설정
│   ├── auth/                # PKCE 헬퍼 + AuthContext(토큰/리프레시/authFetch)
│   ├── components/          # Layout, ProtectedRoute, AuthedMedia, ui, Placeholder
│   ├── pages/
│   │   ├── mma/             # 영상·잡·광고 파이프라인 페이지
│   │   ├── translation/     # 미구현 플레이스홀더
│   │   └── recommendation/  # 미구현 플레이스홀더
│   ├── router.jsx
│   └── main.jsx
└── vite.config.js
```

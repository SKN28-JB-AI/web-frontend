# syntax=docker/dockerfile:1
# web-frontend — Vite 빌드 → nginx 정적 서빙
#
# 백엔드 주소는 "런타임"에 결정된다: 컨테이너 시작 시 docker/40-env.sh 가
# 환경변수(AUTH_BASE/MMA_BASE/...)로 /usr/share/nginx/html/env.js 를 생성하고,
# SPA(src/config.js)는 window.__ENV__ 를 최우선으로 읽는다.
# → Cloudflare Quick Tunnel 등 배포 주소가 매번 바뀌어도 재빌드 불필요.
#   ("/oauth", "/api" 같은 상대 경로를 주면 동일 출처로 호출)
#
# (호환) VITE_* 빌드 인자도 계속 지원 — 런타임 env 미설정 시의 폴백으로 동작.

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
ARG VITE_AUTH_BASE
ARG VITE_MMA_BASE
ENV VITE_AUTH_BASE=$VITE_AUTH_BASE
ENV VITE_MMA_BASE=$VITE_MMA_BASE
COPY . .
RUN npm run build

# ---- serve ----
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# 런타임 설정 생성 스크립트 (nginx 공식 이미지가 /docker-entrypoint.d/*.sh 자동 실행)
COPY docker/40-env.sh /docker-entrypoint.d/40-env.sh
RUN chmod +x /docker-entrypoint.d/40-env.sh
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

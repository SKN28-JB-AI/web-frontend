# syntax=docker/dockerfile:1
# web-frontend — Vite 빌드 → nginx 정적 서빙
#
# VITE_* 값은 빌드 시점에 번들에 구워진다. 이 값들은 "브라우저가" 접근하는
# 주소이므로 컨테이너 내부 호스트가 아니라 호스트 게시 포트(localhost:9000/8000)를
# 가리켜야 한다. 기본값은 src/config.js + .env 참고.

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- serve ----
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

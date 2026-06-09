import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 개발 서버는 5173 포트 고정 — auth-server 시드의
// redirect_uri(http://localhost:5173/callback)와 정확히 일치해야 한다.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
});

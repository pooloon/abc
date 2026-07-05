import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** GitHub Pages: https://pooloon.github.io/abc/ */
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    proxy: {
      "/api/yahoo": {
        target: "https://query1.finance.yahoo.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/yahoo/, ""),
      },
      "/api/dart": {
        target: "https://opendart.fss.or.kr",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dart/, "/api"),
      },
      "/api/krx": {
        target: "http://data.krx.co.kr",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/krx/, ""),
      },
      "/openai-api": {
        target: "https://api.openai.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/openai-api/, ""),
      },
    },
  },
});

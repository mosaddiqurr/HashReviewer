import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    cacheDir: "../.vite-cache",
    publicDir: "../assets",
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": env.VITE_API_PROXY_TARGET ?? "http://localhost:8000",
      },
    },
    build: {
      sourcemap: false,
      target: "es2022",
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/tests/setup.ts",
      include: ["src/**/*.test.{ts,tsx}"],
      css: true,
    },
    preview: {
      proxy: { "/api": env.VITE_API_PROXY_TARGET ?? "http://127.0.0.1:8000" },
    },
  };
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy /api to Flask backend. changeOrigin rewrites the Host header the
// backend sees to localhost:8080, so Flask's url_for(_external=True) (used
// to build OAuth redirect_uri values) generates the backend's own address
// consistently, regardless of which origin the browser is actually on.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    globals: true,
  },
});

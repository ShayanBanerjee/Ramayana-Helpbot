import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy /api to Flask backend
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8080"
    }
  }
});

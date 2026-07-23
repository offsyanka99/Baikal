import { defineConfig } from "vite";

// Built assets are served from /portal/ by nginx (same origin as /api/).
export default defineConfig({
  base: "/portal/",
  build: {
    outDir: "../html/portal",
    emptyOutDir: true,
    // Omit source maps from production images (smaller + less recon surface)
    sourcemap: false,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: { rollupOptions: { input: { app: "index.html", case: "case.html" } } },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    hmr: { host: "127.0.0.1", clientPort: 5173 },
    watch: {
      usePolling: true,
      interval: 150,
      ignored: ["**/reference/**", "**/tests/screenshots/**", "**/dist/**"],
    },
  },
});

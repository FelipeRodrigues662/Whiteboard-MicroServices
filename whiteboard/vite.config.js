import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      '4150-2804-4a24-61ac-ba00-a936-245c-28a7-7121.ngrok-free.app'
    ]
  },
  optimizeDeps: {
    include: ["fabric"],
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
});

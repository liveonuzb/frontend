import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import viteImagemin from "vite-plugin-imagemin";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteImagemin({
      jpgtran: {
        progressive: true,
      },
      pngquant: {
        quality: [0.6, 0.8],
      },
      mozjpeg: {
        quality: 75,
      },
      webp: {
        quality: 75,
      },
    }),
  ],
  define: {},
  server: {
    port: 3030,
    allowedHosts: true,
  },
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

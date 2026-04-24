import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import viteImagemin from "vite-plugin-imagemin";
import compression from "vite-plugin-compression";
import { visualizer } from "rollup-plugin-visualizer";

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
    compression({ algorithm: "brotliCompress" }),
    visualizer({
      filename: "dist/stats.html",
      open: true,
      gzipSize: true,
      brotliSize: true,
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
  build: {
    target: "esnext",
    minify: "terser",
    sourcemap: false,
    cssCodeSplit: true,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },

    rollupOptions: {
      output: {
        manualChunks: {
          qr: ["html5-qrcode", "qrcode"],
          media: ["recordrtc", "react-media-recorder"],
          react: ["react", "react-dom", "react-router"],
          query: ["@tanstack/react-query"],
          phone: ["react-phone-number-input", "libphonenumber-js"],
          charts: ["recharts"],
          pdf: ["jspdf", "html2canvas"],
          motion: ["framer-motion"],
        },
      },
    },
  },
});

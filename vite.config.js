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
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-phone-number-input")) return "phone";
            if (id.includes("libphonenumber-js")) return "phone";
            if (id.includes("jspdf") || id.includes("html2canvas"))
              return "pdf";
            if (id.includes("recharts")) return "charts";
            if (id.includes("framer-motion")) return "motion";
            if (id.includes("html5-qrcode") || id.includes("qrcode"))
              return "qr";
            if (id.includes("recordrtc") || id.includes("react-media-recorder"))
              return "media";
            if (id.includes("@tanstack/react-query")) return "query";
            if (id.includes("react")) return "react";
          }
        },
      },
    },
  },
});

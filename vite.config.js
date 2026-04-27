import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import compression from "vite-plugin-compression";
import viteImagemin from "vite-plugin-imagemin";

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    tailwindcss(),
    viteImagemin({
      jpgtran: { progressive: true },
      pngquant: { quality: [0.6, 0.8] },
      mozjpeg: { quality: 75 },
      webp: { quality: 75 },
    }),

    compression({
      algorithm: "brotliCompress",
      ext: ".br",
      deleteOriginFile: false,
    }),
    compression({
      algorithm: "gzip",
      ext: ".gz",
      deleteOriginFile: false,
    }),
  ],

  server: {
    port: 3030,
    allowedHosts: true,
  },

  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },

  build: {
    target: ["es2020", "chrome80", "safari13"],
    modulePreload: {
      polyfill: false,
    },
    minify: "oxc",
    cssMinify: "lightningcss",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
    emptyOutDir: true,
    sourcemap: false,
    assetsInlineLimit: 1024,
    esbuild: {
      drop: ["console", "debugger"],
      legalComments: "none",
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@tanstack/react-query",
      ],
      exclude: [
        "jspdf",
        "html2canvas",
        "html5-qrcode",
        "recordrtc",
        "react-media-recorder",
      ],
    },

    rollupOptions: {
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
      },
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (
            id.includes("react-phone-number-input") ||
            id.includes("libphonenumber-js")
          ) {
            return "phone";
          }

          if (id.includes("jspdf") || id.includes("html2canvas")) return "pdf";
          if (id.includes("recharts")) return "charts";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("html5-qrcode") || id.includes("qrcode")) return "qr";

          if (id.includes("recordrtc") || id.includes("react-media-recorder")) {
            return "media";
          }

          if (id.includes("@tanstack/react-query")) return "query";
          if (id.includes("react-dom")) return "react-dom";
          if (id.includes("react-router")) return "react-router";
          if (id.includes("/react/")) return "react";

          return "vendor";
        },
      },
    },
  },
});

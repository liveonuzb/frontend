import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const getPackageName = (id) => {
  const [packagePath] = id.split("node_modules/").at(-1).split("/");

  if (packagePath.startsWith("@")) {
    const [, scopedName] = id.split("node_modules/").at(-1).split("/");

    return `${packagePath}/${scopedName}`;
  }

  return packagePath;
};

const matchesPackage = (packageName, entries) =>
  entries.some((entry) =>
    entry.endsWith("/") || entry.endsWith("-")
      ? packageName.startsWith(entry)
      : packageName === entry,
  );

const manualChunks = (id) => {
  if (!id.includes("node_modules")) {
    return undefined;
  }

  const packageName = getPackageName(id);

  if (
    matchesPackage(packageName, [
      "react",
      "react-dom",
      "react-router",
      "scheduler",
      "use-sync-external-store",
    ])
  ) {
    return "react-vendor";
  }

  if (matchesPackage(packageName, ["@tanstack/", "axios", "nuqs", "zustand"])) {
    return "data-vendor";
  }

  if (
    matchesPackage(packageName, [
      "@base-ui/",
      "@radix-ui/",
      "@floating-ui/",
      "@internationalized/",
      "@react-aria/",
      "@react-stately/",
      "@react-types/",
      "vaul",
      "next-themes",
      "lucide-react",
      "use-callback-ref",
      "react-remove-scroll",
      "react-remove-scroll-bar",
      "react-style-singleton",
      "aria-hidden",
      "tabbable",
      "get-nonce",
    ])
  ) {
    return "ui-vendor";
  }

  if (matchesPackage(packageName, ["@dnd-kit/"])) {
    return "dnd-vendor";
  }

  if (
    matchesPackage(packageName, [
      "framer-motion",
      "motion",
      "motion-dom",
      "motion-utils",
      "canvas-confetti",
      "react-confetti",
      "react-joyride",
      "react-floater",
    ])
  ) {
    return "motion-vendor";
  }

  if (
    matchesPackage(packageName, [
      "recharts",
      "recharts-scale",
      "victory-vendor",
      "react-smooth",
      "d3-",
      "internmap",
      "fast-equals",
    ])
  ) {
    return "charts-vendor";
  }

  if (
    matchesPackage(packageName, [
      "html2canvas",
      "canvg",
      "stackblur-canvas",
      "rgbcolor",
      "svg-pathdata",
      "fast-png",
      "iobuffer",
      "fflate",
      "pako",
      "dompurify",
    ])
  ) {
    return "pdf-render-vendor";
  }

  if (packageName === "jspdf") {
    return "pdf-core-vendor";
  }

  if (packageName === "html5-qrcode") {
    return "qr-vendor";
  }

  if (
    matchesPackage(packageName, [
      "react-hook-form",
      "@hookform/resolvers",
      "zod",
      "input-otp",
    ])
  ) {
    return "form-vendor";
  }

  if (
    matchesPackage(packageName, [
      "react-phone-number-input",
      "libphonenumber-js",
      "country-flag-icons",
      "input-format",
    ])
  ) {
    return "phone-input-vendor";
  }

  if (
    matchesPackage(packageName, [
      "lodash",
      "date-fns",
      "clsx",
      "class-variance-authority",
      "tailwind-merge",
      "react-use",
      "sonner",
      "core-js",
      "prop-types",
      "@babel/runtime",
      "deepmerge",
      "tslib",
    ])
  ) {
    return "utils-vendor";
  }

  return "vendor";
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __BUNDLED_DEV__: "true",
    __SERVER_FORWARD_CONSOLE__: "false",
  },
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
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
});

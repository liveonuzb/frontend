import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

const isCoolifyBuild = Boolean(
  process.env.COOLIFY_FQDN || process.env.COOLIFY_RESOURCE_UUID,
);

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
    target: "esnext",
    minify: isCoolifyBuild ? false : "esbuild",
    cssMinify: !isCoolifyBuild,
    reportCompressedSize: false,
  },
});

import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import build from "@hono/vite-build/node";
import devServer from "@hono/vite-dev-server";
import ssrPlugin from "vite-ssr-components/plugin";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));

  const resolve = {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  };

  if (mode === "server") {
    return {
      resolve,
      plugins: [
        build({
          entry: "./src/index.tsx",
          staticRoot: "./dist",
        }),
      ],
    };
  }

  return {
    server: {
      watch: {
        ignored: ["**/data/**"],
      },
    },
    build: {
      emptyOutDir: true,
    },
    envPrefix: ["VITE_", "REMOTION_"],
    plugins: [
      devServer({
        entry: "./src/index.tsx",
      }),
      tailwindcss(),
      ssrPlugin(),
      react(),
    ],
    resolve,
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"],
    },
  };
});

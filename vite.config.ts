// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

// Automatically inject environment variables from .env and .lovable/.env into process.env for local dev/SSR
const rootEnv = loadEnv(process.env["NODE_ENV"] || "development", process.cwd(), "");
const lovableEnv = loadEnv(process.env["NODE_ENV"] || "development", `${process.cwd()}/.lovable`, "");

const serviceRoleKey =
  process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
  rootEnv["SUPABASE_SERVICE_ROLE_KEY"] ||
  lovableEnv["SUPABASE_SERVICE_ROLE_KEY"] ||
  "";

if (serviceRoleKey) {
  process.env["SUPABASE_SERVICE_ROLE_KEY"] = serviceRoleKey;
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});

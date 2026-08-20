import { resolve } from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

// Deliberately NOT `mergeConfig`/`extends` on top of vite.config.js. That file's
// `define: { "process.env": {}, ... }` block replaces `process.env` with `{}` at
// transform time inside `src/`, which breaks anything reading `process.env.*`
// (TZ handling here included, plus assorted library internals). Keep this
// config standalone rather than "helpfully" merging the two later.
//
// The Tailwind plugin (`@tailwindcss/vite`) is also intentionally left out:
// tests never render through the real CSS pipeline, so processing Tailwind
// here would only slow the run down for no benefit.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./src/test/setup.ts"],
    // Explicit even though it's the default: with CSS processing off, Vitest
    // returns a proxy for `*.module.scss` imports (`styles.foo` -> `"foo"`),
    // so component tests never need sass to actually run.
    css: false,
    env: {
      // Pin the timezone so `parseDate`/`formatDate` (local-midnight parsing,
      // `toLocaleString`) behave the same in CI as on a dev machine. Verified
      // by a smoke test in src/test/tz.test.ts rather than assumed.
      TZ: "UTC",
    },
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: [
        "src/test/**",
        "**/*.d.ts",
        "src/main.jsx",
      ],
      // No thresholds yet: Phase 1 only adds a handful of smoke tests, so any
      // percentage gate here would be meaningless. Revisit once Phases 2-5
      // bring real coverage.
    },
  },
});

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
      // Ratchet, not a target: Phase 5 (src/main.test.tsx plus everything the
      // three Phase 2-4 test agents added) brought coverage to ~59/40/53/61%
      // (stmts/branch/funcs/lines - see `npm run test:coverage`). These
      // thresholds sit a couple of points below that so CI fails if coverage
      // drops, not so it demands more of it; raise them opportunistically as
      // real coverage grows, don't set them ahead of it.
      thresholds: {
        statements: 58,
        branches: 39,
        functions: 51,
        lines: 59,
      },
    },
  },
});

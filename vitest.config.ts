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
      // Ratchet, not a target: raise these opportunistically as real coverage
      // grows, don't set them ahead of it. They sit a couple of points below
      // actual coverage so CI fails if it drops, not so it demands more.
      //
      // Phase 5 (src/main.test.tsx plus everything the three Phase 2-4 test
      // agents added) reached ~59/40/53/61% (stmts/branch/funcs/lines - see
      // `npm run test:coverage`); covering the supporting-grants modules that
      // arrived with the section rework took it to ~68/50/63/69%. Testing the
      // features merged from main took it to ~75/61/67/76% - the branch jump is
      // Request/Users/Resources, three components with no test file before.
      thresholds: {
        statements: 72,
        branches: 58,
        functions: 65,
        lines: 73,
      },
    },
  },
});

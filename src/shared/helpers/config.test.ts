import { describe, expect, it } from "vitest";
import config from "@/shared/helpers/config";

// `config` used to also carry a `routes` singleton, mutated in place by
// `addRoutes()` (see src/main.jsx's mount functions), which needed a
// `beforeEach` reset in src/test/setup.ts to keep overrides from one test
// file leaking into the next. Task #3 of the routes-injection refactor
// removed both `addRoutes()` and `config.routes` in favor of the per-store
// `routesAtom` (src/shared/routes.ts), so all that's left of `config` is the
// plain, static lookup tables below - nothing here is mutated by any code
// path, so there's nothing to reset between tests.
describe("config", () => {
  it("exposes a static credit alert threshold", () => {
    expect(config.creditAlertThreshold).toBe(1000);
  });

  it("exposes static resource type icon names", () => {
    expect(config.resourceTypeIcons).toEqual({
      credit: "cash-coin",
      compute: "cpu-fill",
      storage: "hdd-fill",
      program: "person-square",
    });
  });

  it("exposes static role icon names", () => {
    expect(config.roleIcons).toEqual({
      PI: "person-fill-check",
      "Co-PI": "person-fill-add",
      "Allocation Manager": "person-fill-gear",
      User: "people-fill",
    });
  });
});

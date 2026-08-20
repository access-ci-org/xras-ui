import { describe, expect, it } from "vitest";
import config from "@/shared/helpers/config";
import { addRoutes } from "@/shared/helpers/utils";

// `config` is a singleton and `addRoutes()` mutates `config.routes` in place
// (see src/main.jsx, which every mount function calls it from), so without
// the `beforeEach` reset in src/test/setup.ts an override made in one test
// file would leak into whichever test happens to run after it. These two
// tests only pass, in this order, because that reset runs between them.
describe("config.routes reset", () => {
  it("lets a test override a route", () => {
    addRoutes({ how_to_path: () => "/overridden" });
    expect(config.routes.how_to_path()).toBe("/overridden");
  });

  it("starts the next test with the default route restored", () => {
    expect(config.routes.how_to_path()).toBe("/how-to");
  });
});

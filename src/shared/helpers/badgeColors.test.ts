import { describe, expect, it } from "vitest";
import { badgeColorClasses } from "@/shared/helpers/badgeColors";

// This module is a plain lookup table (no functions to exercise), so the
// test is really a contract check: every variant a caller might index by
// name has to keep resolving to a background + foreground pair. Locking in
// the full set of keys means a renamed/removed variant fails loudly here
// instead of silently rendering `undefined` classes in a badge somewhere.
describe("badgeColorClasses", () => {
  it("exposes exactly the expected set of variant names", () => {
    expect(Object.keys(badgeColorClasses).sort()).toEqual(
      ["danger", "dark", "info", "light", "primary", "secondary", "success", "warning"].sort(),
    );
  });

  it("pairs every variant with a background and a foreground/text class", () => {
    for (const [variant, classes] of Object.entries(badgeColorClasses)) {
      expect(classes, `variant "${variant}"`).toMatch(/\bbg-/);
      expect(classes, `variant "${variant}"`).toMatch(/text-/);
    }
  });

  it("maps specific variants to their known class strings", () => {
    expect(badgeColorClasses.primary).toBe("bg-primary text-primary-foreground");
    expect(badgeColorClasses.success).toBe("bg-emerald-600 text-white");
    expect(badgeColorClasses.dark).toBe("bg-[#212529] text-white");
  });
});

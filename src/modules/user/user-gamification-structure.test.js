import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const srcDir = resolve(process.cwd(), "src");

describe("user gamification structure", () => {
  it("keeps user-facing gamification UI inside the user module", () => {
    expect(
      existsSync(resolve(srcDir, "modules/user/pages/leaderboard/index.jsx")),
    ).toBe(true);
    expect(
      existsSync(
        resolve(srcDir, "modules/user/containers/leaderboard/index.jsx"),
      ),
    ).toBe(true);
    expect(
      existsSync(resolve(srcDir, "modules/user/components/gamification-badges.jsx")),
    ).toBe(true);

    const userModule = readFileSync(
      resolve(srcDir, "modules/user/index.jsx"),
      "utf8",
    );

    expect(userModule).toContain(
      'import("@/modules/user/pages/leaderboard/index.jsx")',
    );
    expect(userModule).toContain('path="leaderboard"');
    expect(existsSync(resolve(srcDir, "modules/gamification"))).toBe(false);
    expect(existsSync(resolve(srcDir, "components/gamification-badges"))).toBe(
      false,
    );
  });
});

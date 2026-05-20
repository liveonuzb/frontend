import { beforeEach, describe, expect, it, vi } from "vitest";

const tMock = vi.hoisted(() =>
  vi.fn((key, options = {}) =>
    key === "store.gamification.xpSpent"
      ? "XP spent"
      : options.defaultValue ?? key,
  ),
);

vi.mock("@/lib/i18n", () => ({
  default: {
    t: tMock,
  },
}));

const importGamificationStore = async () => {
  vi.resetModules();
  return import("./gamification-store.js");
};

describe("gamification store", () => {
  beforeEach(() => {
    localStorage.clear();
    tMock.mockClear();
  });

  it("stores translated XP spend activity text", async () => {
    const { default: useGamificationStore } = await importGamificationStore();
    useGamificationStore.setState({ xp: 2450, xpLog: [] });

    const spent = useGamificationStore.getState().spendXP(100);

    expect(spent).toBe(true);
    expect(useGamificationStore.getState().xpLog[0]).toEqual(
      expect.objectContaining({
        activity: "XP spent",
        xp: -100,
      }),
    );
  });
});

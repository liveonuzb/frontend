import { describe, expect, it } from "vitest";
import {
  getPlanDayStatus,
  resolvePlanColumnsForDate,
} from "./nutrition-plan-days.js";

const thirtyDayKanban = {
  "day-1": [{ id: "day-1-breakfast", type: "Nonushta", items: [] }],
  "day-30": [{ id: "day-30-breakfast", type: "Nonushta", items: [] }],
};

describe("nutrition plan day resolution", () => {
  it("maps active 30-day plans by startDate day offset", () => {
    const plan = {
      durationDays: 30,
      startDate: "2026-05-01T00:00:00.000Z",
      weeklyKanban: thirtyDayKanban,
    };

    expect(
      resolvePlanColumnsForDate(
        plan,
        new Date("2026-05-01T12:00:00.000Z"),
        "Juma",
      ),
    ).toEqual(thirtyDayKanban["day-1"]);
    expect(
      resolvePlanColumnsForDate(
        plan,
        new Date("2026-05-30T12:00:00.000Z"),
        "Shanba",
      ),
    ).toEqual(thirtyDayKanban["day-30"]);
  });

  it("marks a 30-day plan expired after day 30", () => {
    const plan = {
      durationDays: 30,
      startDate: "2026-05-01T00:00:00.000Z",
      weeklyKanban: thirtyDayKanban,
    };

    expect(
      getPlanDayStatus(plan, new Date("2026-05-31T12:00:00.000Z")),
    ).toMatchObject({
      isExpired: true,
      dayNumber: 31,
      durationDays: 30,
    });
    expect(
      resolvePlanColumnsForDate(
        plan,
        new Date("2026-05-31T12:00:00.000Z"),
        "Yakshanba",
      ),
    ).toEqual([]);
  });

  it("keeps legacy weekly plans mapped by weekday", () => {
    const plan = {
      durationDays: null,
      startDate: null,
      weeklyKanban: {
        Dushanba: [{ id: "monday", type: "Nonushta", items: [] }],
      },
    };

    expect(
      resolvePlanColumnsForDate(
        plan,
        new Date("2026-05-04T12:00:00.000Z"),
        "Dushanba",
      ),
    ).toEqual(plan.weeklyKanban.Dushanba);
  });
});

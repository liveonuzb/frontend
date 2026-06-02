import { describe, expect, it } from "vitest";
import { generateWeeklyKanban } from "./ai-generator-drawer-utils.js";

const foods = [
  {
    id: 1,
    name: "Tuxum",
    baseCal: 150,
    baseProtein: 13,
    baseCarbs: 1,
    baseFat: 10,
    defaultAmount: 100,
    unit: "g",
  },
  {
    id: 2,
    name: "Guruch",
    baseCal: 360,
    baseProtein: 7,
    baseCarbs: 80,
    baseFat: 1,
    defaultAmount: 100,
    unit: "g",
  },
];

describe("AI meal plan drawer generator", () => {
  it("can generate canonical 30-day kanban keys", () => {
    const kanban = generateWeeklyKanban(foods, "maintain", 2100, 3, 30);

    expect(Object.keys(kanban)).toHaveLength(30);
    expect(kanban["day-1"]).toHaveLength(3);
    expect(kanban["day-30"]).toHaveLength(3);
    expect(kanban.Dushanba).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import { COACH_MOBILE_NAV_ITEMS, COACH_NAV_GROUPS } from "./navigation.js";

describe("coach navigation IA", () => {
  it("groups desktop navigation by coach workflow", () => {
    expect(COACH_NAV_GROUPS.map((group) => group.label)).toEqual([
      "CRM",
      "Rejalar",
      "Savdo",
      "Telegram",
      "Analitika",
      "Sozlamalar",
    ]);
    expect(
      COACH_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.to)),
    ).toEqual(
      expect.arrayContaining([
        "/coach/clients",
        "/coach/meal-plans",
        "/coach/payments",
        "/coach/telegram-bot",
        "/coach/reports",
        "/coach/settings",
      ]),
    );
  });

  it("keeps mobile navigation focused on top coach actions", () => {
    expect(COACH_MOBILE_NAV_ITEMS.map((item) => item.label)).toEqual([
      "Boshqaruv",
      "Mijozlar",
      "Chat",
      "To'lovlar",
      "Telegram",
    ]);
  });
});

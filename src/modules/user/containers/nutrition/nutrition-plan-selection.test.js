import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  getPlanBuilderData,
  getPlanInsights,
  getPlanSourceMeta,
  getPlanStatusMeta,
  useNutritionPlanSelection,
} from "./nutrition-plan-selection.js";

const createPlan = (overrides = {}) => ({
  id: "plan-1",
  name: "Plan",
  status: "draft",
  source: "manual",
  createdAt: "2026-05-01T00:00:00.000Z",
  updatedAt: "2026-05-02T00:00:00.000Z",
  days: [],
  ...overrides,
});

describe("nutrition plan selection", () => {
  it("summarizes plan days for insights and builder data", () => {
    const plan = createPlan({
      updatedAt: "2026-05-14T00:00:00.000Z",
      days: [
        {
          meals: [
            { id: "breakfast", items: [{ id: "food-1" }] },
            { id: "lunch", items: [] },
          ],
        },
        {
          meals: [
            { id: "breakfast", items: [] },
            { id: "dinner", items: [{ id: "food-2" }, { id: "food-3" }] },
          ],
        },
      ],
    });

    expect(getPlanInsights(plan)).toMatchObject({
      filledDays: 2,
      totalItems: 3,
      updatedLabel: new Date("2026-05-14T00:00:00.000Z").toLocaleDateString(
        "uz-UZ",
      ),
    });
    expect(getPlanBuilderData(plan)).toEqual({
      "day-1": plan.days[0].meals,
      "day-2": plan.days[1].meals,
    });
  });

  it("provides stable status and source presentation metadata", () => {
    expect(getPlanStatusMeta("active")).toMatchObject({
      label: "Faol reja",
      chipClassName: expect.stringContaining("green"),
    });
    expect(getPlanStatusMeta("archived")).toMatchObject({
      label: "Arxivlangan reja",
      chipClassName: expect.stringContaining("slate"),
    });
    expect(getPlanStatusMeta("draft")).toMatchObject({
      label: "Saqlangan reja",
      chipClassName: expect.stringContaining("amber"),
    });
    expect(getPlanSourceMeta("ai")).toMatchObject({
      label: "AI reja",
      badgeClassName: expect.stringContaining("violet"),
    });
    expect(getPlanSourceMeta("manual")).toMatchObject({
      label: "Manual reja",
      badgeClassName: expect.stringContaining("amber"),
    });
  });

  it("selects the active plan first and preserves an explicit valid selection", () => {
    const activePlan = createPlan({
      id: "active",
      status: "active",
      updatedAt: "2026-05-01T00:00:00.000Z",
    });
    const draftPlan = createPlan({
      id: "draft",
      status: "draft",
      updatedAt: "2026-05-03T00:00:00.000Z",
    });
    const archivedPlan = createPlan({
      id: "archived",
      status: "archived",
      updatedAt: "2026-05-04T00:00:00.000Z",
    });

    const { result, rerender } = renderHook(
      ({ plans }) =>
        useNutritionPlanSelection({
          plans,
          activePlan,
          draftPlan,
        }),
      {
        initialProps: {
          plans: [draftPlan, archivedPlan, activePlan],
        },
      },
    );

    expect(result.current.selectedPlanId).toBe("active");
    expect(result.current.currentPlan).toBe(activePlan);
    expect(result.current.orderedPlans.map((plan) => plan.id)).toEqual([
      "active",
      "draft",
      "archived",
    ]);

    act(() => {
      result.current.setSelectedPlanId("archived");
    });

    expect(result.current.currentPlan).toBe(archivedPlan);

    rerender({ plans: [draftPlan, archivedPlan, activePlan] });

    expect(result.current.selectedPlanId).toBe("archived");
  });

  it("falls back to the next available plan when the selected plan disappears", () => {
    const activePlan = createPlan({ id: "active", status: "active" });
    const draftPlan = createPlan({ id: "draft", status: "draft" });
    const archivedPlan = createPlan({ id: "archived", status: "archived" });

    const { result, rerender } = renderHook(
      ({ plans, active }) =>
        useNutritionPlanSelection({
          plans,
          activePlan: active,
          draftPlan,
        }),
      {
        initialProps: {
          plans: [activePlan, draftPlan, archivedPlan],
          active: activePlan,
        },
      },
    );

    act(() => {
      result.current.setSelectedPlanId("archived");
    });

    rerender({
      plans: [draftPlan],
      active: null,
    });

    expect(result.current.selectedPlanId).toBe("draft");
    expect(result.current.currentPlan).toBe(draftPlan);
    expect(result.current.planInsightsMap.draft).toMatchObject({
      filledDays: 0,
      totalItems: 0,
    });
  });
});

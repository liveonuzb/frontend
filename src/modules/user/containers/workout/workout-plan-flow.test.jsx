import { describe, expect, it } from "vitest";
import {
  buildWorkoutPlanMetaPayload,
  buildWorkoutPlanSearch,
  normalizeWorkoutPlanStep,
  WORKOUT_PLAN_BUILDER_STEP,
} from "./workout-plan-flow.js";

describe("workout-plan-flow", () => {
  it("keeps the builder step only for valid values", () => {
    expect(normalizeWorkoutPlanStep(WORKOUT_PLAN_BUILDER_STEP)).toBe(
      WORKOUT_PLAN_BUILDER_STEP,
    );
    expect(normalizeWorkoutPlanStep("invalid")).toBeNull();
    expect(normalizeWorkoutPlanStep(null)).toBeNull();
  });

  it("preserves unrelated search params while toggling the step", () => {
    expect(
      buildWorkoutPlanSearch("?tab=plans&date=2026-04-14", WORKOUT_PLAN_BUILDER_STEP),
    ).toBe("?tab=plans&date=2026-04-14&step=builder");

    expect(
      buildWorkoutPlanSearch("?tab=plans&date=2026-04-14&step=builder", null),
    ).toBe("?tab=plans&date=2026-04-14");
  });

  it("builds a meta payload from the base plan while overriding name and description", () => {
    expect(
      buildWorkoutPlanMetaPayload({
        basePlan: {
          difficulty: "O'rta",
          days: 28,
          daysPerWeek: 4,
          schedule: [{ day: "Dushanba", exercises: [] }],
          source: "template",
        },
        name: "  Full body  ",
        description: "  Beginner split  ",
      }),
    ).toEqual({
      name: "Full body",
      description: "Beginner split",
      difficulty: "O'rta",
      days: 28,
      daysPerWeek: 4,
      schedule: [{ day: "Dushanba", exercises: [] }],
      source: "template",
      startDate: undefined,
    });
  });
});

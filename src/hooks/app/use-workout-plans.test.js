import { describe, expect, it } from "vitest";
import {
  buildCustomExercisePayload,
  buildWorkoutPlanPayload,
  normalizeWorkoutPlanDifficulty,
  normalizeWorkoutPlanStatus,
  normalizeWorkoutPlansState,
} from "./use-workout-plans.js";

describe("use-workout-plans helpers", () => {
  it("normalizes localized workout plan difficulty values to canonical API values", () => {
    expect(normalizeWorkoutPlanDifficulty("Boshlang'ich")).toBe("beginner");
    expect(normalizeWorkoutPlanDifficulty("O'rta")).toBe("intermediate");
    expect(normalizeWorkoutPlanDifficulty("Yuqori")).toBe("advanced");
  });

  it("builds workout plan payloads with canonical difficulty values", () => {
    expect(
      buildWorkoutPlanPayload({
        name: "Manual plan",
        difficulty: "O'rta",
        schedule: [],
      }),
    ).toMatchObject({
      difficulty: "intermediate",
    });
  });

  it("builds custom exercise payloads with numeric defaults and private visibility", () => {
    expect(
      buildCustomExercisePayload({
        name: "Backyard sled push",
        trackingType: "DISTANCE_ONLY",
        defaultSets: "4",
        defaultDistanceMeters: "200",
        equipments: ["Sled"],
        targetMuscles: ["Legs"],
      }),
    ).toMatchObject({
      name: "Backyard sled push",
      trackingType: "DISTANCE_ONLY",
      defaultSets: 4,
      defaultDistanceMeters: 200,
      equipments: ["Sled"],
      targetMuscles: ["Legs"],
      visibility: "private",
    });
  });

  it("normalizes workout plan status values to the lowercase API contract", () => {
    expect(normalizeWorkoutPlanStatus("ACTIVE")).toBe("active");
    expect(normalizeWorkoutPlanStatus("DRAFT")).toBe("draft");
    expect(normalizeWorkoutPlanStatus("ARCHIVED")).toBe("archived");
    expect(normalizeWorkoutPlanStatus(null, "template")).toBe("template");
  });

  it("normalizes plan collection status values from legacy uppercase responses", () => {
    const state = normalizeWorkoutPlansState({
      items: [
        { id: "plan-1", name: "Active", status: "ACTIVE", schedule: [] },
        { id: "plan-2", name: "Draft", status: "DRAFT", schedule: [] },
      ],
      templates: [{ id: "template-1", name: "Template", schedule: [] }],
    });

    expect(state.items.map((plan) => plan.status)).toEqual(["active", "draft"]);
    expect(state.templates[0].status).toBe("template");
  });
});

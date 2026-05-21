import { describe, expect, it } from "vitest";
import {
  buildCustomExercisePayload,
  buildWorkoutPlanPayload,
  isTemplateActivationFallbackEligible,
  mergeActivatedWorkoutPlanState,
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
        {
          id: "plan-1",
          name: "Active",
          status: "ACTIVE",
          schedule: [],
          targetWorkouts: "12",
          nextWorkout: {
            planId: "plan-1",
            dayIndex: "2",
            title: "Pull Day",
            exerciseCount: "5",
            estimatedCalories: "320",
            completed: false,
            isStartable: true,
          },
          todayWorkout: {
            dayIndex: "2",
            title: "Pull Day",
            exercisesCount: "5",
            calories: "320",
          },
        },
        { id: "plan-2", name: "Draft", status: "DRAFT", schedule: [] },
      ],
      templates: [{ id: "template-1", name: "Template", schedule: [] }],
    });

    expect(state.items.map((plan) => plan.status)).toEqual(["active", "draft"]);
    expect(state.templates[0].status).toBe("template");
    expect(state.items[0]).toMatchObject({
      targetWorkouts: 12,
      nextWorkout: {
        dayIndex: 2,
        exerciseCount: 5,
        estimatedCalories: 320,
        isStartable: true,
      },
      todayWorkout: {
        dayIndex: 2,
        exercisesCount: 5,
        calories: 320,
      },
    });
  });

  it("merges an activated workout plan into cached plan state", () => {
    const state = mergeActivatedWorkoutPlanState(
      {
        items: [
          {
            id: "old-active",
            name: "Old active",
            status: "active",
            startDate: "2026-05-01T00:00:00.000Z",
            schedule: [],
          },
          {
            id: "draft-plan",
            name: "Draft",
            status: "draft",
            schedule: [],
          },
        ],
        activePlanId: "old-active",
        draftPlanId: "draft-plan",
        templates: [{ id: "template-running", name: "Running", schedule: [] }],
      },
      {
        id: "new-active",
        name: "Running Starter Plan",
        status: "active",
        source: "template",
        schedule: [],
      },
    );

    expect(state.activePlanId).toBe("new-active");
    expect(state.items.map((plan) => [plan.id, plan.status])).toEqual([
      ["new-active", "active"],
      ["old-active", "draft"],
      ["draft-plan", "draft"],
    ]);
    expect(state.items[1].startDate).toBeNull();
    expect(state.templates[0].id).toBe("template-running");
  });

  it("allows create-then-activate fallback only for template activation 404s", () => {
    const templatePlan = {
      id: "workout-template-full-body-strength",
      name: "Full Body Strength",
      isTemplate: true,
      schedule: [{ day: "Day 1", exercises: [] }],
    };

    expect(
      isTemplateActivationFallbackEligible(
        { response: { status: 404 } },
        templatePlan,
      ),
    ).toBe(true);
    expect(
      isTemplateActivationFallbackEligible(
        { response: { status: 500 } },
        templatePlan,
      ),
    ).toBe(false);
    expect(
      isTemplateActivationFallbackEligible(
        { response: { status: 404 } },
        { id: "manual-plan", name: "Manual plan", schedule: [] },
      ),
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  buildGenerateWorkoutPlanPayload,
  calculateOneRepMax,
  getGeneratedPlanSavePayload,
} from "./workout-ai-flow";

describe("workout-ai-flow", () => {
  it("calculates 1RM with the Epley formula", () => {
    expect(calculateOneRepMax(40, 5)).toBe(46);
  });

  it("builds a backend-ready AI generation payload", () => {
    expect(
      buildGenerateWorkoutPlanPayload({
        name: " My Upper Body Day ",
        goal: "muscle_building",
        level: "beginner",
        daysPerWeek: 4,
        equipmentMode: "gym",
        selectedEquipmentIds: [1, "2"],
        focusMuscleIds: [3],
        benchmarkExercise: "Bench Press",
        benchmarkWeight: 40,
        benchmarkReps: 5,
        caloriesGoal: 2400,
      }),
    ).toMatchObject({
      name: "My Upper Body Day",
      goal: "muscle_building",
      level: "beginner",
      daysPerWeek: 4,
      equipmentMode: "gym",
      selectedEquipmentIds: [1, 2],
      focusMuscleIds: [3],
      benchmark: {
        exerciseName: "Bench Press",
        weightKg: 40,
        reps: 5,
        oneRepMaxKg: 46,
      },
      caloriesGoal: 2400,
    });
  });

  it("keeps generation metadata when saving a preview", () => {
    expect(
      getGeneratedPlanSavePayload({
        name: "AI Plan",
        schedule: [{ day: "DAY 1", exercises: [] }],
        generationMeta: { model: "gpt-5.2" },
      }),
    ).toMatchObject({
      name: "AI Plan",
      schedule: [{ day: "DAY 1", exercises: [] }],
      generationMeta: { model: "gpt-5.2" },
      source: "ai",
    });
  });
});

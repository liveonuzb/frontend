import { describe, expect, it, vi } from "vitest";
import {
  buildSavePlan,
  filterExercises,
  getCategories,
  initFromPlan,
} from "./builder-utils.js";

describe("workout plan builder utils", () => {
  it("preserves plan day and exercise order through edit normalization", () => {
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.11)
      .mockReturnValueOnce(0.22)
      .mockReturnValueOnce(0.33);

    const plan = {
      id: "plan-1",
      name: "Order plan",
      description: "Keep order",
      days: 21,
      daysPerWeek: 2,
      schedule: [
        {
          day: "Day 2",
          focus: "Back",
          exercises: [
            { name: "Lat Pulldown", trackingType: "REPS_WEIGHT", sets: 3 },
            { name: "Cable Row", trackingType: "REPS_WEIGHT", sets: 2 },
          ],
        },
        {
          day: "Day 1",
          focus: "Chest",
          exercises: [
            { name: "Bench Press", trackingType: "REPS_WEIGHT", sets: 4 },
          ],
        },
      ],
    };

    const library = [
      { id: 1, name: "Bench Press", trackingType: "REPS_WEIGHT", defaultSets: 4 },
      { id: 2, name: "Lat Pulldown", trackingType: "REPS_WEIGHT", defaultSets: 3 },
      { id: 3, name: "Cable Row", trackingType: "REPS_WEIGHT", defaultSets: 2 },
    ];

    const { days, exercises } = initFromPlan(plan, library);
    const savedPlan = buildSavePlan({
      planSource: plan,
      planName: plan.name,
      planDescription: plan.description,
      trainDays: days,
      exercisesByDay: exercises,
    });

    expect(savedPlan.schedule.map((day) => day.day)).toEqual(["Day 2", "Day 1"]);
    expect(savedPlan.schedule[0].exercises.map((exercise) => exercise.name)).toEqual([
      "Lat Pulldown",
      "Cable Row",
    ]);
    expect(savedPlan.schedule[1].exercises.map((exercise) => exercise.name)).toEqual([
      "Bench Press",
    ]);
  });

  it("keeps exercise search and category filtering predictable", () => {
    const library = [
      { name: "Bench Press", category: "Chest" },
      { name: "Cable Row", category: "Back" },
      { name: "Goblet Squat", category: "Legs" },
    ];

    expect(getCategories(library)).toEqual(["all", "Chest", "Back", "Legs"]);
    expect(filterExercises(library, "row", "all")).toEqual([
      { name: "Cable Row", category: "Back" },
    ]);
    expect(filterExercises(library, "", "Legs")).toEqual([
      { name: "Goblet Squat", category: "Legs" },
    ]);
  });
});

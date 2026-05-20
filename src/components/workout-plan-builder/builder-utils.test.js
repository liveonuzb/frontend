import { describe, expect, it, vi } from "vitest";
import {
  buildSavePlan,
  filterExercises,
  getCategories,
  initFromPlan,
} from "./builder-utils.js";

import { map } from "lodash";

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

    expect(map(savedPlan.schedule, (day) => day.day)).toEqual(["Day 2", "Day 1"]);
    expect(map(savedPlan.schedule[0].exercises, (exercise) => exercise.name)).toEqual([
      "Lat Pulldown",
      "Cable Row",
    ]);
    expect(map(savedPlan.schedule[1].exercises, (exercise) => exercise.name)).toEqual([
      "Bench Press",
    ]);
  });

  it("builds a backend schedule contract with stable day and exercise metadata", () => {
    const trainDays = [
      {
        id: "day-client-1",
        name: "Day 1",
        dayKey: "day-1",
        focus: "Chest",
      },
    ];
    const exercisesByDay = {
      "day-client-1": [
        {
          id: "ex-client-1",
          exerciseId: 7,
          name: "Bench Press",
          trackingType: "REPS_WEIGHT",
          defaultSets: 3,
          defaultReps: 12,
          defaultDurationSeconds: 0,
          defaultDistanceMeters: 0,
          rest: 90,
          sets: [{ reps: 12, weight: 40, restSeconds: 90 }],
        },
      ],
    };

    const savedPlan = buildSavePlan({
      planSource: { id: "plan-1", days: 28, daysPerWeek: 1 },
      planName: "Upper split",
      planDescription: "Strength plan",
      trainDays,
      exercisesByDay,
    });

    expect(savedPlan.schedule).toEqual([
      expect.objectContaining({
        day: "Day 1",
        dayKey: "day-1",
        orderIndex: 0,
        focus: "Chest",
        exercises: [
          expect.objectContaining({
            exerciseId: 7,
            orderIndex: 0,
            trackingType: "REPS_WEIGHT",
            defaultSets: 3,
            defaultReps: 12,
            defaultRestSeconds: 90,
            sets: [{ reps: 12, weight: 40, restSeconds: 90 }],
          }),
        ],
      }),
    ]);
  });

  it("keeps custom exercise ids separate from numeric catalog exercise ids", () => {
    const trainDays = [
      {
        id: "day-client-1",
        name: "Day 1",
        dayKey: "day-1",
        focus: "Legs",
      },
    ];
    const exercisesByDay = {
      "day-client-1": [
        {
          id: "ex-client-1",
          exerciseId: null,
          customExerciseId: "custom-1",
          source: "custom",
          isCustom: true,
          name: "Backyard sled push",
          trackingType: "DISTANCE_ONLY",
          defaultSets: 4,
          defaultDistanceMeters: 200,
          rest: 90,
          sets: [{ distanceMeters: 200, restSeconds: 90 }],
        },
      ],
    };

    const savedPlan = buildSavePlan({
      planSource: { id: "plan-1", days: 28, daysPerWeek: 1 },
      planName: "Custom plan",
      planDescription: "",
      trainDays,
      exercisesByDay,
    });

    expect(savedPlan.schedule[0].exercises[0]).toMatchObject({
      exerciseId: null,
      customExerciseId: "custom-1",
      source: "custom",
      isCustom: true,
      name: "Backyard sled push",
    });
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

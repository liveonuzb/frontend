import { describe, expect, it } from "vitest";
import {
  getNextStartableDayIndex,
  isWorkoutDayLocked,
} from "./utils.js";

describe("workout plan day helpers", () => {
  it("keeps later workout days open even when an earlier day is incomplete", () => {
    const plan = {
      schedule: [
        { title: "Day 1", exercises: [{ name: "Squat" }] },
        { title: "Day 2", exercises: [{ name: "Bench Press" }] },
      ],
      dayProgress: [
        { dayIndex: 0, completed: false, exerciseCount: 1 },
        { dayIndex: 1, completed: false, exerciseCount: 1 },
      ],
    };

    expect(isWorkoutDayLocked(plan, 1)).toBe(false);
  });

  it("uses the backend nextWorkout day as the default start target", () => {
    const plan = {
      nextWorkout: {
        dayIndex: 2,
      },
      schedule: [
        { title: "Day 1", exercises: [{ name: "Squat" }] },
        { title: "Day 2", exercises: [{ name: "Bench Press" }] },
        { title: "Day 3", exercises: [{ name: "Pull-up" }] },
      ],
      dayProgress: [
        { dayIndex: 0, completed: false, exerciseCount: 1 },
        { dayIndex: 1, completed: false, exerciseCount: 1 },
        { dayIndex: 2, completed: false, exerciseCount: 1 },
      ],
    };

    expect(getNextStartableDayIndex(plan)).toBe(2);
  });

  it("treats skipped workout days as locked and outside the fallback queue", () => {
    const plan = {
      schedule: [
        { title: "Day 1", exercises: [{ name: "Squat" }] },
        { title: "Day 2", exercises: [{ name: "Bench Press" }] },
      ],
      dayProgress: [
        { dayIndex: 0, skipped: true, exerciseCount: 1 },
        { dayIndex: 1, completed: false, skipped: false, exerciseCount: 1 },
      ],
    };

    expect(isWorkoutDayLocked(plan, 0)).toBe(true);
    expect(getNextStartableDayIndex(plan)).toBe(1);
  });
});

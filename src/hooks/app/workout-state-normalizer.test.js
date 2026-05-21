import { describe, expect, it } from "vitest";
import {
  normalizeWorkoutPlanSnapshot,
  normalizeWorkoutPlansCollection,
  normalizeWorkoutStateSnapshot,
} from "./workout-state-normalizer.js";

describe("workout-state-normalizer", () => {
  it("normalizes a canonical plan snapshot once for plans and overview hooks", () => {
    const plan = normalizeWorkoutPlanSnapshot({
      id: "plan-1",
      status: "ACTIVE",
      days: "42",
      daysPerWeek: "4",
      completedWorkouts: "7",
      skippedWorkouts: "2",
      remainingWorkouts: "9",
      targetWorkouts: "18",
      progress: "39",
      schedule: [{ day: "Day 1", exercises: [{ name: "Squat" }] }],
      dayProgress: [
        {
          dayIndex: "0",
          completed: "yes",
          skipped: "",
          exerciseCount: "1",
        },
      ],
      nextWorkout: {
        planId: "plan-1",
        dayIndex: "3",
        title: "Lower Body",
        exercisesCount: "5",
        calories: "320",
      },
      todayWorkout: {
        dayIndex: "3",
        title: "Lower Body",
        exercisesCount: "5",
        calories: "320",
      },
    });

    expect(plan).toMatchObject({
      id: "plan-1",
      status: "active",
      days: 42,
      daysPerWeek: 4,
      completedWorkouts: 7,
      skippedWorkouts: 2,
      remainingWorkouts: 9,
      targetWorkouts: 18,
      progress: 39,
      dayProgress: [
        {
          dayIndex: 0,
          completed: true,
          skipped: false,
          exerciseCount: 1,
        },
      ],
      nextWorkout: {
        dayIndex: 3,
        exerciseCount: 5,
        estimatedCalories: 320,
      },
      todayWorkout: {
        dayIndex: 3,
        exercisesCount: 5,
        calories: 320,
      },
    });
  });

  it("normalizes workout state and falls back to the active plan snapshot", () => {
    const activePlan = normalizeWorkoutPlanSnapshot({
      id: "plan-1",
      status: "active",
      nextWorkout: {
        planId: "plan-1",
        dayIndex: "1",
        title: "Push",
        exerciseCount: "4",
        isStartable: true,
      },
    });

    expect(normalizeWorkoutStateSnapshot({}, activePlan)).toMatchObject({
      activeSession: null,
      activePlan,
      nextWorkout: {
        dayIndex: 1,
        exerciseCount: 4,
      },
      canStartWorkout: true,
      blockReason: null,
      hasSessionConflict: false,
    });

    expect(
      normalizeWorkoutStateSnapshot({
        activeSession: {
          type: "running",
          session: { workoutSessionId: "run-1", planDayIndex: "4" },
        },
        activePlan,
        nextWorkout: activePlan.nextWorkout,
        canStartWorkout: false,
        blockReason: "ACTIVE_WORKOUT_SESSION_EXISTS",
        hasSessionConflict: true,
      }),
    ).toMatchObject({
      activeSession: {
        type: "running",
        session: {
          workoutSessionId: "run-1",
          planDayIndex: 4,
        },
      },
      canStartWorkout: false,
      blockReason: "ACTIVE_WORKOUT_SESSION_EXISTS",
      hasSessionConflict: true,
    });
  });

  it("normalizes plan collections and template status consistently", () => {
    const state = normalizeWorkoutPlansCollection({
      items: [{ id: "plan-1", status: "ACTIVE", schedule: [] }],
      templates: [{ id: "template-1", status: "DRAFT", schedule: [] }],
      activePlanId: "plan-1",
    });

    expect(state.items[0].status).toBe("active");
    expect(state.templates[0].status).toBe("template");
    expect(state.activePlanId).toBe("plan-1");
  });
});

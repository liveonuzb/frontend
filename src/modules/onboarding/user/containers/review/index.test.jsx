import { describe, expect, it } from "vitest";
import { buildCompletePayload } from "./index.jsx";
import {
  getHealthConstraintsSummary,
  getReviewBlockingErrors,
  getReviewRecommendations,
} from "./review-issues.js";

const t = (key) => key;

const baseState = {
  firstName: "Ali",
  gender: "male",
  age: "28",
  height: { value: "178", unit: "cm" },
  currentWeight: { value: "82", unit: "kg" },
  goal: "lose",
  targetWeight: { value: "76", unit: "kg" },
  weeklyPace: 0.5,
  activityLevel: "moderately-active",
  weeklyWorkoutCount: "0",
  workoutExperience: "",
  mealFrequency: "3",
  completedUserOnboardingSteps: ["health-constraints"],
  healthConstraints: ["none"],
  customHealthConstraints: [],
};

describe("review issue classification", () => {
  it("keeps optional nutrition gaps as recommendations, not blockers", () => {
    const state = {
      ...baseState,
      foodBudgetTier: null,
      allergyIds: [],
      customAllergies: [],
      preferredCuisineIds: [],
      customPreferredCuisines: [],
    };

    expect(getReviewBlockingErrors(state, t)).toEqual([]);
    expect(getReviewRecommendations(state, t)).toEqual([]);
  });

  it("classifies missing required profile data as blockers", () => {
    const state = {
      ...baseState,
      firstName: "",
    };

    expect(getReviewBlockingErrors(state, t)).toContain(
      "onboarding.review.missing.name",
    );
  });

  it("does not summarize unanswered health constraints as none", () => {
    const state = {
      ...baseState,
      completedUserOnboardingSteps: [],
      healthConstraints: [],
      customHealthConstraints: [],
    };

    expect(getReviewBlockingErrors(state, t)).toContain(
      "onboarding.review.missing.healthConstraints",
    );
    expect(getHealthConstraintsSummary(state, t)).toBe(
      "onboarding.review.emptyValue",
    );
  });

  it("summarizes explicit no health constraints without blocking", () => {
    const state = {
      ...baseState,
      completedUserOnboardingSteps: ["health-constraints"],
      healthConstraints: ["none"],
      customHealthConstraints: [],
    };

    expect(getReviewBlockingErrors(state, t)).not.toContain(
      "onboarding.review.missing.healthConstraints",
    );
    expect(getHealthConstraintsSummary(state, t)).toBe(
      "onboarding.healthConstraints.noneSummary",
    );
  });
});

describe("review completion payload", () => {
  it("does not submit unsupported workout experience when clearing removed plan data", () => {
    const payload = buildCompletePayload({
      ...baseState,
      weeklyWorkoutCount: "4",
      workoutExperience: "advanced",
      workoutLocation: "gym",
      equipmentIds: [1],
      customEquipment: ["dumbbell"],
      workoutBodyPartIds: [2],
      customWorkoutBodyParts: ["legs"],
      preferredExerciseIds: [3],
      dislikedExerciseIds: [4],
      customPreferredExercises: ["push up"],
      customDislikedExercises: ["burpee"],
    });

    expect(payload).not.toHaveProperty("workoutExperience");
    expect(payload).toHaveProperty("weeklyWorkoutCount", 0);
    expect(payload).toHaveProperty("workoutLocation", null);
    expect(payload).toHaveProperty("equipmentIds", []);
    expect(payload).toHaveProperty("customEquipment", []);
    expect(payload).toHaveProperty("workoutBodyPartIds", []);
    expect(payload).toHaveProperty("customWorkoutBodyParts", []);
    expect(payload).toHaveProperty("preferredExerciseIds", []);
    expect(payload).toHaveProperty("dislikedExerciseIds", []);
    expect(payload).toHaveProperty("customPreferredExercises", []);
    expect(payload).toHaveProperty("customDislikedExercises", []);
    expect(payload).toHaveProperty("completed", true);
  });
});

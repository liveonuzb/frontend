import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkoutExercisesPage from "./index.jsx";
import { useWorkoutLogs } from "@/hooks/app/use-workout-logs";
import {
  useWorkoutExerciseCategories,
  useWorkoutExercises,
} from "@/hooks/app/use-workout-plans";

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("@/components/page-loader/index.jsx", () => ({
  default: () => <div data-testid="page-loader">Loading</div>,
}));

vi.mock("../workout-exercise-detail-drawer.jsx", () => ({
  default: ({ open, exercise }) =>
    open ? (
      <div data-testid="exercise-detail-drawer">{exercise?.name}</div>
    ) : null,
}));

vi.mock("@/store", () => ({
  useBreadcrumbStore: () => ({
    setBreadcrumbs: vi.fn(),
  }),
}));

vi.mock("@/hooks/app/use-workout-logs", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useWorkoutLogs: vi.fn(),
  };
});

vi.mock("@/hooks/app/use-workout-plans", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useWorkoutExerciseCategories: vi.fn(),
    useWorkoutExercises: vi.fn(),
  };
});

const exercises = [
  {
    id: "push-up",
    name: "Push-up",
    category: "Chest",
    trackingType: "REPS_WEIGHT",
    equipments: ["Bodyweight"],
    targetMuscles: ["Chest"],
  },
  {
    id: "squat",
    name: "Squat",
    category: "Legs",
    trackingType: "REPS_WEIGHT",
    equipments: ["Barbell"],
    targetMuscles: ["Quads"],
  },
];

describe("WorkoutExercisesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkoutExerciseCategories.mockReturnValue({
      categories: [{ id: "strength", name: "Strength" }],
      isLoading: false,
    });
    useWorkoutExercises.mockReturnValue({
      exercises,
      isLoading: false,
    });
    useWorkoutLogs.mockReturnValue({
      items: [],
    });
  });

  it("renders the exercise library and filters by search query", () => {
    render(<WorkoutExercisesPage />);

    expect(screen.getByText("Mashqlar kutubxonasi")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Mashq qidirish..."), {
      target: { value: "squat" },
    });

    expect(screen.getByText("Squat")).toBeInTheDocument();
    expect(screen.queryByText("Push-up")).not.toBeInTheDocument();
  });

  it("shows an empty state when the search filter has no matching exercises", () => {
    render(<WorkoutExercisesPage />);

    fireEvent.change(screen.getByPlaceholderText("Mashq qidirish..."), {
      target: { value: "deadlift" },
    });

    expect(
      screen.getByText("Tanlangan filter bo'yicha mashq topilmadi."),
    ).toBeInTheDocument();
  });
});

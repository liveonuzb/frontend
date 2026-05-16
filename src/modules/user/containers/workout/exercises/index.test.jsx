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
  default: ({ open, exercise, onOpenChange }) =>
    open ? (
      <div data-testid="exercise-detail-drawer">
        {exercise?.name}
        <button type="button" onClick={() => onOpenChange(false)}>
          Close drawer
        </button>
      </div>
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
      categories: [
        { id: "strength", name: "Strength" },
        { id: "legs", name: "Legs" },
      ],
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

  it("passes category filters to the catalog hook and keeps cards keyboard-visible", () => {
    render(<WorkoutExercisesPage />);

    fireEvent.click(screen.getByRole("button", { name: "Legs" }));

    expect(useWorkoutExercises).toHaveBeenLastCalledWith({
      categoryId: "legs",
      query: "",
    });
    expect(screen.getByRole("button", { name: /squat/i })).toHaveClass(
      "focus-visible:ring-2",
    );
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

  it("opens the exercise detail drawer from an exercise card", () => {
    render(<WorkoutExercisesPage />);

    fireEvent.click(screen.getByRole("button", { name: /push-up/i }));

    expect(screen.getByTestId("exercise-detail-drawer")).toHaveTextContent(
      "Push-up",
    );
  });

  it("closes the exercise detail drawer through onOpenChange", () => {
    render(<WorkoutExercisesPage />);

    fireEvent.click(screen.getByRole("button", { name: /push-up/i }));
    fireEvent.click(screen.getByRole("button", { name: /close drawer/i }));

    expect(screen.queryByTestId("exercise-detail-drawer")).not.toBeInTheDocument();
  });
});

import React from "react";
import "@/lib/i18n";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WorkoutExercisesPage from "./index.jsx";
import { useWorkoutLogs } from "@/hooks/app/use-workout-logs";
import { useStartRunningSession } from "@/hooks/app/use-running-sessions";
import {
  useCreateCustomWorkoutExercise,
  useWorkoutCatalog,
  useWorkoutExerciseCategories,
  useWorkoutExercises,
} from "@/hooks/app/use-workout-plans";
import {
  useFavoriteActions,
  useFavorites,
} from "@/hooks/app/use-favorites";

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
    useCreateCustomWorkoutExercise: vi.fn(),
    useWorkoutCatalog: vi.fn(),
    useWorkoutExerciseCategories: vi.fn(),
    useWorkoutExercises: vi.fn(),
  };
});

vi.mock("@/hooks/app/use-running-sessions", () => ({
  useStartRunningSession: vi.fn(),
}));

vi.mock("@/hooks/app/use-favorites", () => ({
  useFavoriteActions: vi.fn(),
  useFavorites: vi.fn(),
}));

const exercises = [
  {
    id: "push-up",
    name: "Push-up",
    category: "Chest",
    trackingType: "REPS_WEIGHT",
    difficulty: "Boshlang'ich",
    equipments: ["Bodyweight"],
    targetMuscles: ["Chest"],
  },
  {
    id: "squat",
    name: "Squat",
    category: "Legs",
    trackingType: "REPS_WEIGHT",
    difficulty: "O'rta",
    equipments: ["Barbell"],
    targetMuscles: ["Quads"],
  },
];

const renderPage = () => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/workout/exercises",
        element: <WorkoutExercisesPage />,
      },
      {
        path: "/user/workout/running/live/:workoutSessionId",
        element: <div>Running live</div>,
      },
    ],
    {
      initialEntries: ["/user/workout/exercises"],
    },
  );

  render(<RouterProvider router={router} />);
  return router;
};

describe("WorkoutExercisesPage", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    useWorkoutExerciseCategories.mockReturnValue({
      categories: [
        { id: "strength", name: "Strength" },
        { id: "legs", name: "Legs" },
      ],
      isLoading: false,
    });
    useWorkoutCatalog.mockReturnValue({
      catalog: {
        equipments: [
          { id: 3, name: "Barbell" },
          { id: 4, name: "Bodyweight" },
        ],
        muscles: [
          { id: 5, name: "Quads" },
          { id: 6, name: "Chest" },
        ],
      },
    });
    useWorkoutExercises.mockReturnValue({
      exercises,
      isLoading: false,
    });
    useCreateCustomWorkoutExercise.mockReturnValue({
      createExercise: vi.fn().mockResolvedValue({ id: "custom:custom-1" }),
      isPending: false,
    });
    useWorkoutLogs.mockReturnValue({
      items: [],
    });
    useStartRunningSession.mockReturnValue({
      startRunningSession: vi.fn().mockResolvedValue({
        workoutSessionId: "run-new",
      }),
      isPending: false,
    });
    useFavorites.mockReturnValue({
      favoriteIds: new Set(["push-up"]),
      isLoading: false,
    });
    useFavoriteActions.mockReturnValue({
      toggleFavorite: vi.fn().mockResolvedValue(undefined),
      isPendingFor: vi.fn(() => false),
    });
  });

  it("renders the exercise library and filters by search query", () => {
    renderPage();

    expect(screen.getByText("Mashqlar kutubxonasi")).toBeInTheDocument();
    expect(screen.getByText("Qiyinlik: O'rta")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Mashq qidirish..."), {
      target: { value: "squat" },
    });

    expect(screen.getByText("Squat")).toBeInTheDocument();
    expect(screen.queryByText("Push-up")).not.toBeInTheDocument();
  });

  it("passes category filters to the catalog hook and keeps cards keyboard-visible", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Legs" }));

    expect(useWorkoutExercises).toHaveBeenLastCalledWith({
      categoryId: "legs",
      equipmentId: null,
      muscleId: null,
      query: "",
      limit: 50,
      cursor: null,
      sort: "popular",
    });
    expect(
      screen.getByRole("button", { name: "Mashq tafsilotlari: Squat" }),
    ).toHaveClass("focus-visible:ring-2");
  });

  it("debounces the search query before requesting exercises", () => {
    vi.useFakeTimers();

    renderPage();

    fireEvent.change(screen.getByPlaceholderText("Mashq qidirish..."), {
      target: { value: "squat" },
    });

    expect(useWorkoutExercises).toHaveBeenLastCalledWith({
      categoryId: null,
      equipmentId: null,
      muscleId: null,
      query: "",
      limit: 50,
      cursor: null,
      sort: "popular",
    });

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(useWorkoutExercises).toHaveBeenLastCalledWith({
      categoryId: null,
      equipmentId: null,
      muscleId: null,
      query: "",
      limit: 50,
      cursor: null,
      sort: "popular",
    });

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(useWorkoutExercises).toHaveBeenLastCalledWith({
      categoryId: null,
      equipmentId: null,
      muscleId: null,
      query: "squat",
      limit: 50,
      cursor: null,
      sort: "popular",
    });
  });

  it("passes the selected sort mode to the exercise hook", () => {
    renderPage();

    expect(useWorkoutExercises).toHaveBeenLastCalledWith({
      categoryId: null,
      equipmentId: null,
      muscleId: null,
      query: "",
      limit: 50,
      cursor: null,
      sort: "popular",
    });

    fireEvent.change(screen.getByLabelText("Saralash"), {
      target: { value: "name" },
    });

    expect(useWorkoutExercises).toHaveBeenLastCalledWith({
      categoryId: null,
      equipmentId: null,
      muscleId: null,
      query: "",
      limit: 50,
      cursor: null,
      sort: "name",
    });
  });

  it("switches between list and grid exercise views", () => {
    renderPage();

    expect(screen.getByTestId("exercise-results")).toHaveAttribute(
      "data-view-mode",
      "list",
    );

    fireEvent.click(screen.getByRole("button", { name: "Katak" }));

    expect(screen.getByTestId("exercise-results")).toHaveAttribute(
      "data-view-mode",
      "grid",
    );

    fireEvent.click(screen.getByRole("button", { name: "Ro'yxat" }));

    expect(screen.getByTestId("exercise-results")).toHaveAttribute(
      "data-view-mode",
      "list",
    );
  });

  it("shows a retry state when exercises fail to load", () => {
    const refetchExercises = vi.fn();

    useWorkoutExercises.mockReturnValue({
      exercises: [],
      isLoading: false,
      isError: true,
      refetch: refetchExercises,
    });

    renderPage();

    expect(screen.getByText("Mashqlarni yuklab bo'lmadi.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /qayta urinish/i }));

    expect(refetchExercises).toHaveBeenCalledTimes(1);
  });

  it("loads the next exercise page with the backend cursor", async () => {
    useWorkoutExercises.mockImplementation((params) =>
      params.cursor === "squat"
        ? {
            exercises: [
              {
                id: "lunge",
                name: "Lunge",
                category: "Legs",
                trackingType: "REPS_WEIGHT",
                equipments: ["Bodyweight"],
                targetMuscles: ["Quads"],
              },
            ],
            meta: { hasMore: false, nextCursor: null },
            isLoading: false,
          }
        : {
            exercises,
            meta: { hasMore: true, nextCursor: "squat" },
            isLoading: false,
          },
    );

    renderPage();

    expect(screen.getByText("Push-up")).toBeInTheDocument();
    expect(screen.getByText("Squat")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /ko'proq yuklash/i }));

    await waitFor(() => {
      expect(screen.getByText("Lunge")).toBeInTheDocument();
    });
    expect(screen.getByText("Push-up")).toBeInTheDocument();
    expect(useWorkoutExercises).toHaveBeenLastCalledWith({
      categoryId: null,
      equipmentId: null,
      muscleId: null,
      query: "",
      limit: 50,
      cursor: "squat",
      sort: "popular",
    });
  });

  it("passes equipment and muscle filters to the catalog hook and can reset filters", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Barbell" }));
    expect(useWorkoutExercises).toHaveBeenLastCalledWith({
      categoryId: null,
      equipmentId: 3,
      muscleId: null,
      query: "",
      limit: 50,
      cursor: null,
      sort: "popular",
    });

    fireEvent.click(screen.getByRole("button", { name: "Quads" }));
    expect(useWorkoutExercises).toHaveBeenLastCalledWith({
      categoryId: null,
      equipmentId: 3,
      muscleId: 5,
      query: "",
      limit: 50,
      cursor: null,
      sort: "popular",
    });

    fireEvent.click(screen.getByRole("button", { name: "Filtrlarni tozalash" }));
    expect(useWorkoutExercises).toHaveBeenLastCalledWith({
      categoryId: null,
      equipmentId: null,
      muscleId: null,
      query: "",
      limit: 50,
      cursor: null,
      sort: "popular",
    });
  });

  it("shows an empty state when the search filter has no matching exercises", () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText("Mashq qidirish..."), {
      target: { value: "deadlift" },
    });

    expect(
      screen.getByText("Tanlangan filter bo'yicha mashq topilmadi."),
    ).toBeInTheDocument();
  });

  it("opens the exercise detail drawer from an exercise card", () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("button", { name: "Mashq tafsilotlari: Push-up" }),
    );

    expect(screen.getByTestId("exercise-detail-drawer")).toHaveTextContent(
      "Push-up",
    );
  });

  it("closes the exercise detail drawer through onOpenChange", () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("button", { name: "Mashq tafsilotlari: Push-up" }),
    );
    fireEvent.click(screen.getByRole("button", { name: /close drawer/i }));

    expect(screen.queryByTestId("exercise-detail-drawer")).not.toBeInTheDocument();
  });

  it("renders persistent exercise favorite buttons without opening details", async () => {
    const toggleFavorite = vi.fn().mockResolvedValue(undefined);
    useFavoriteActions.mockReturnValue({
      toggleFavorite,
      isPendingFor: vi.fn(() => false),
    });

    renderPage();

    expect(
      screen.getByRole("button", {
        name: "Sevimlilardan olib tashlash: Push-up",
      }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Sevimlilarga qo'shish: Squat" }),
    );

    await waitFor(() => {
      expect(toggleFavorite).toHaveBeenCalledWith("squat", false);
    });
    expect(screen.queryByTestId("exercise-detail-drawer")).not.toBeInTheDocument();
  });

  it("creates a private custom exercise from the library drawer", async () => {
    const createExercise = vi.fn().mockResolvedValue({ id: "custom:custom-1" });
    useCreateCustomWorkoutExercise.mockReturnValue({
      createExercise,
      isPending: false,
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /custom mashq/i }));
    fireEvent.change(screen.getByLabelText("Mashq nomi"), {
      target: { value: "Backyard sled push" },
    });
    fireEvent.change(screen.getByLabelText("Jihozlar"), {
      target: { value: "Sled" },
    });
    fireEvent.change(screen.getByLabelText("Target muscles"), {
      target: { value: "Legs" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));

    await waitFor(() => {
      expect(createExercise).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Backyard sled push",
          equipment: "Sled",
          equipments: ["Sled"],
          targetMuscles: ["Legs"],
          visibility: "private",
        }),
      );
    });
  });

  it("renders running tool shortcuts and starts a run without opening the deprecated running page", async () => {
    const startRunningSession = vi.fn().mockResolvedValue({
      workoutSessionId: "run-new",
    });

    useStartRunningSession.mockReturnValue({
      startRunningSession,
      isPending: false,
    });

    const router = renderPage();

    expect(screen.getByText("Kardio va outdoor")).toBeInTheDocument();
    expect(screen.getByText("Yugurishni boshlash")).toBeInTheDocument();
    expect(screen.getByText("Marshrut va intervallar")).toBeInTheDocument();
    expect(screen.getByText("Yugurish uchun qizish")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /yugurishni boshlash/i }));

    expect(startRunningSession).toHaveBeenCalledWith({
      source: "exercise-library",
    });
    await screen.findByText("Running live");
    expect(router.state.location.pathname).toBe("/user/workout/running/live/run-new");
  });
});

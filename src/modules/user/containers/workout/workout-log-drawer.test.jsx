import React from "react";
import "@/lib/i18n";
import i18n from "@/lib/i18n";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { useWorkoutExercises } from "@/hooks/app/use-workout-plans";
import WorkoutLogDrawer from "./workout-log-drawer.jsx";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/components/ui/drawer", async () => {
  const React = await import("react");

  return {
    Drawer: ({ open, children }) => (open ? <div>{children}</div> : null),
    DrawerBody: ({ children, ...props }) => <div {...props}>{children}</div>,
    DrawerContent: ({ children, ...props }) => <div {...props}>{children}</div>,
    DrawerDescription: ({ children, ...props }) => <p {...props}>{children}</p>,
    DrawerFooter: ({ children, ...props }) => <div {...props}>{children}</div>,
    DrawerHeader: ({ children, ...props }) => <div {...props}>{children}</div>,
    DrawerTitle: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
  };
});

vi.mock("@/hooks/app/use-workout-plans", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useWorkoutExercises: vi.fn(),
  };
});

const exerciseCatalog = [
  {
    id: "push-up",
    name: "Push-up",
    category: "Chest",
    groupLabel: "Chest",
    trackingType: "REPS_WEIGHT",
    defaultSets: 1,
    defaultReps: 10,
    defaultRestSeconds: 60,
  },
  {
    id: "squat",
    name: "Squat",
    category: "Legs",
    groupLabel: "Legs",
    trackingType: "REPS_WEIGHT",
    defaultSets: 1,
    defaultReps: 8,
    defaultRestSeconds: 90,
  },
];

describe("WorkoutLogDrawer", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("uz");
    vi.clearAllMocks();
    useWorkoutExercises.mockReturnValue({
      exercises: [
        ...exerciseCatalog,
        {
          id: "legacy-empty-name",
          category: "General",
          trackingType: "REPS_WEIGHT",
          defaultReps: 10,
        },
      ],
      isLoading: false,
    });
  });

  it("selects an exercise and saves a valid workout log", async () => {
    const onSave = vi.fn().mockResolvedValue({});

    render(<WorkoutLogDrawer open onOpenChange={vi.fn()} onSave={onSave} />);

    const searchInput = screen.getByPlaceholderText(/qidirish/i);
    expect(searchInput).toBeInTheDocument();
    expect(screen.getByText("Push-up")).toBeInTheDocument();
    expect(screen.getByText("Squat")).toBeInTheDocument();
    expect(screen.getByText("2 results")).toBeInTheDocument();

    fireEvent.change(searchInput, {
      target: { value: "squat" },
    });

    expect(screen.getByText("Squat")).toBeInTheDocument();
    expect(screen.getByText("1 results")).toBeInTheDocument();
    expect(screen.queryByText("Push-up")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Squat"));
    fireEvent.click(screen.getByRole("button", { name: /saqlash|save/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Squat",
          exerciseId: "squat",
          trackingType: "REPS_WEIGHT",
          entries: [
            expect.objectContaining({
              reps: 8,
              durationMinutes: 2,
              burnedCalories: 10,
            }),
          ],
        }),
      );
    });
  });

  it("falls back to the bundled catalog when API exercises are unnamed", () => {
    useWorkoutExercises.mockReturnValue({
      exercises: [
        {
          id: "legacy-empty-name",
          category: "General",
          trackingType: "REPS_WEIGHT",
        },
      ],
      isLoading: false,
    });

    render(<WorkoutLogDrawer open onOpenChange={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByText("Bench Press")).toBeInTheDocument();
    expect(screen.queryByText("0 results")).not.toBeInTheDocument();
  });

  it("does not save and shows validation when no set has a valid value", async () => {
    const onSave = vi.fn();

    render(
      <WorkoutLogDrawer
        open
        onOpenChange={vi.fn()}
        onSave={onSave}
        initialExercise={{
          id: "empty-reps",
          name: "Empty reps",
          trackingType: "REPS_ONLY",
          defaultSets: 1,
          defaultReps: 0,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /saqlash|save/i }));

    expect(onSave).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Kamida 1 ta to'g'ri set kiriting");
  });

  it("adds, updates, and removes set rows without saving stale totals", async () => {
    const onSave = vi.fn().mockResolvedValue({});

    render(
      <WorkoutLogDrawer
        open
        onOpenChange={vi.fn()}
        onSave={onSave}
        initialExercise={{
          id: "push-up",
          name: "Push-up",
          trackingType: "REPS_ONLY",
          defaultSets: 1,
          defaultReps: 10,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /yana set/i }));

    const setInputs = screen.getAllByRole("textbox");
    expect(setInputs).toHaveLength(2);

    fireEvent.change(setInputs[1], { target: { value: "15" } });
    fireEvent.click(screen.getByRole("button", { name: /saqlash|save/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          entries: [
            expect.objectContaining({ reps: 10 }),
            expect.objectContaining({ reps: 15 }),
          ],
        }),
      );
    });

    onSave.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /2-setni olib tashlash/i }));
    fireEvent.click(screen.getByRole("button", { name: /saqlash|save/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          entries: [
            expect.objectContaining({
              reps: 10,
              durationMinutes: 2,
              burnedCalories: 10,
            }),
          ],
        }),
      );
    });

    expect(onSave.mock.calls[0][0].entries).toHaveLength(1);
  });
});

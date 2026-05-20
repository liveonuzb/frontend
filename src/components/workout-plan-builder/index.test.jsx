import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import WorkoutPlanBuilder from "./index.jsx";

const translate = (key, params) =>
  key === "components.workoutPlanBuilder.dayName"
    ? `${params.count}-kun`
    : key;

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: translate,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/hooks/utils/use-mobile.js", () => ({
  default: () => false,
}));

vi.mock("@/hooks/app/use-workout-plans.js", () => ({
  useWorkoutExerciseCategories: () => ({
    categories: [],
    isLoading: false,
  }),
  useWorkoutExercises: () => ({
    exercises: [],
  }),
}));

vi.mock("@/components/ui/drawer.jsx", () => ({
  Drawer: ({ children, open }) => (open ? <div>{children}</div> : null),
  DrawerContent: ({ children }) => <div>{children}</div>,
}));

vi.mock("./builder-header.jsx", () => ({
  default: () => <div data-testid="builder-header" />,
}));

vi.mock("./builder-footer.jsx", () => ({
  default: () => <div data-testid="builder-footer" />,
}));

vi.mock("./builder-mobile-view.jsx", () => ({
  default: () => <div data-testid="builder-mobile-view" />,
}));

vi.mock("./builder-mobile-library.jsx", () => ({
  default: () => <div data-testid="builder-mobile-library" />,
}));

vi.mock("./builder-meta-drawer.jsx", () => ({
  default: () => <div data-testid="builder-meta-drawer" />,
}));

vi.mock("./builder-desktop-view.jsx", () => ({
  default: ({ trainDays, onUpdateDay }) => (
    <button
      type="button"
      onClick={() =>
        onUpdateDay(trainDays[0].id, {
          focus: "Updated focus",
        })
      }
    >
      update-day-focus
    </button>
  ),
}));

describe("WorkoutPlanBuilder", () => {
  it("reports dirty state when a builder day changes", async () => {
    const onDirtyChange = vi.fn();

    render(
      <WorkoutPlanBuilder
        open
        initialPlan={{
          id: "plan-1",
          name: "Starter plan",
          description: "Starter description",
          schedule: [
            {
              day: "1-kun",
              focus: "Initial focus",
              exercises: [],
            },
          ],
        }}
        onSave={vi.fn()}
        onDirtyChange={onDirtyChange}
      />,
    );

    await waitFor(() => {
      expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    });

    fireEvent.click(screen.getByText("update-day-focus"));

    await waitFor(() => {
      expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    });
  });
});

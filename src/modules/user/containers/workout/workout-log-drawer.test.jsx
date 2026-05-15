import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { useGetQuery } from "@/hooks/api";
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

vi.mock("@/hooks/api", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useGetQuery: vi.fn(),
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
];

describe("WorkoutLogDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGetQuery.mockReturnValue({
      data: {
        data: exerciseCatalog,
      },
      isLoading: false,
    });
  });

  it("selects an exercise and saves a valid workout log", async () => {
    const onSave = vi.fn().mockResolvedValue({});

    render(<WorkoutLogDrawer open onOpenChange={vi.fn()} onSave={onSave} />);

    expect(screen.getByPlaceholderText(/qidirish/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Push-up"));
    fireEvent.click(screen.getByRole("button", { name: /saqlash|save/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Push-up",
          entries: expect.any(Array),
        }),
      );
    });
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
});

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CreateWorkoutLogPage from "./index.jsx";
import { useCreateWorkoutLog } from "@/hooks/app/use-workout-logs";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../workout-log-drawer.jsx", () => ({
  default: ({
    dateKey,
    initialExercise,
    isSubmitting,
    onOpenChange,
    onSave,
    open,
  }) => (
    <div data-testid="workout-log-drawer">
      <div data-testid="drawer-open">{String(open)}</div>
      <div data-testid="drawer-date-key">{dateKey || ""}</div>
      <div data-testid="drawer-initial-exercise">
        {initialExercise?.name || ""}
      </div>
      <div data-testid="drawer-is-submitting">{String(isSubmitting)}</div>
      <button
        type="button"
        onClick={() =>
          onSave({ name: "Push-up", entries: [{ sets: 1, reps: 10 }] })
        }
      >
        Save drawer
      </button>
      <button type="button" onClick={() => onOpenChange(false)}>
        Close drawer
      </button>
    </div>
  ),
}));

vi.mock("@/hooks/app/use-workout-logs", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useCreateWorkoutLog: vi.fn(),
  };
});

const createLogMock = vi.fn();

const renderPage = (initialEntry = "/user/workout/logs/create") => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/workout",
        element: <div>Workout dashboard</div>,
      },
      {
        path: "/user/workout/logs/create",
        element: <CreateWorkoutLogPage />,
      },
    ],
    {
      initialEntries: [initialEntry],
    },
  );

  render(<RouterProvider router={router} />);
  return router;
};

describe("CreateWorkoutLogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createLogMock.mockResolvedValue({});
    useCreateWorkoutLog.mockReturnValue({
      createLog: createLogMock,
      isPending: false,
    });
  });

  it("saves a quick workout log and returns to workout home", async () => {
    const router = renderPage();

    expect(screen.getByTestId("workout-log-drawer")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-open")).toHaveTextContent("true");
    expect(screen.getByTestId("drawer-date-key")).toBeEmptyDOMElement();
    expect(screen.getByTestId("drawer-initial-exercise")).toBeEmptyDOMElement();
    expect(screen.getByTestId("drawer-is-submitting")).toHaveTextContent("false");

    fireEvent.click(screen.getByText("Save drawer"));

    await waitFor(() => {
      expect(createLogMock).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Push-up" }),
      );
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/user/workout");
    });
  });

  it("passes date and initial exercise route state into the drawer and closes back with the query string", async () => {
    useCreateWorkoutLog.mockReturnValue({
      createLog: createLogMock,
      isPending: true,
    });

    const router = renderPage({
      pathname: "/user/workout/logs/create",
      search: "?date=2026-05-15",
      state: {
        initialExercise: {
          id: "push-up",
          name: "Push-up",
          trackingType: "REPS_ONLY",
        },
      },
    });

    expect(screen.getByTestId("drawer-open")).toHaveTextContent("true");
    expect(screen.getByTestId("drawer-date-key")).toHaveTextContent("2026-05-15");
    expect(screen.getByTestId("drawer-initial-exercise")).toHaveTextContent(
      "Push-up",
    );
    expect(screen.getByTestId("drawer-is-submitting")).toHaveTextContent("true");

    fireEvent.click(screen.getByText("Close drawer"));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/user/workout");
    });
    expect(router.state.location.search).toBe("?date=2026-05-15");
  });
});

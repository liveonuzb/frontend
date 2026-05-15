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
  default: ({ onSave }) => (
    <div data-testid="workout-log-drawer">
      <button
        type="button"
        onClick={() =>
          onSave({ name: "Push-up", entries: [{ sets: 1, reps: 10 }] })
        }
      >
        Save drawer
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

const renderPage = () => {
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
      initialEntries: ["/user/workout/logs/create"],
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
});

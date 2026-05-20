import React from "react";
import "@/lib/i18n";
import i18n from "@/lib/i18n";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import EditWorkoutLogPage from "./index.jsx";
import {
  useUpdateWorkoutLog,
  useWorkoutLog,
} from "@/hooks/app/use-workout-logs";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/page-loader/index.jsx", () => ({
  default: () => <div data-testid="page-loader">Loading</div>,
}));

vi.mock("../../workout-log-drawer.jsx", () => ({
  default: ({
    dateKey,
    initialLog,
    isSubmitting,
    onOpenChange,
    onSave,
    open,
  }) => (
    <div data-testid="workout-log-drawer">
      <div data-testid="drawer-open">{String(open)}</div>
      <div>{initialLog.name}</div>
      <div data-testid="drawer-initial-log-id">{initialLog.id}</div>
      <div data-testid="drawer-date-key">{dateKey || ""}</div>
      <div data-testid="drawer-is-submitting">{String(isSubmitting)}</div>
      <button
        type="button"
        onClick={() =>
          onSave({ name: "Updated squat", entries: [{ sets: 1, reps: 8 }] })
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
    useUpdateWorkoutLog: vi.fn(),
    useWorkoutLog: vi.fn(),
  };
});

const updateLogMock = vi.fn();

const renderPage = () => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/workout",
        element: <div>Workout dashboard</div>,
      },
      {
        path: "/user/workout/logs/edit/:logGroupId",
        element: <EditWorkoutLogPage />,
      },
    ],
    {
      initialEntries: ["/user/workout/logs/edit/log-1"],
    },
  );

  render(<RouterProvider router={router} />);
  return router;
};

describe("EditWorkoutLogPage", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("uz");
    vi.clearAllMocks();
    updateLogMock.mockResolvedValue({});
    useUpdateWorkoutLog.mockReturnValue({
      updateLog: updateLogMock,
      isPending: false,
    });
    useWorkoutLog.mockReturnValue({
      log: {
        id: "log-1",
        name: "Squat",
        date: "2026-05-15",
        items: [{ reps: 6, weight: 80 }],
      },
      isLoading: false,
    });
  });

  it("shows a loader while the log is loading", () => {
    useWorkoutLog.mockReturnValue({
      log: null,
      isLoading: true,
    });

    renderPage();

    expect(screen.getByTestId("page-loader")).toBeInTheDocument();
  });

  it("updates a workout log and returns to workout home", async () => {
    const router = renderPage();

    expect(screen.getByTestId("drawer-open")).toHaveTextContent("true");
    expect(screen.getByTestId("drawer-initial-log-id")).toHaveTextContent("log-1");
    expect(screen.getByTestId("drawer-date-key")).toHaveTextContent("2026-05-15");
    expect(screen.getByTestId("drawer-is-submitting")).toHaveTextContent("false");

    fireEvent.click(screen.getByText("Save drawer"));

    await waitFor(() => {
      expect(updateLogMock).toHaveBeenCalledWith(
        "log-1",
        expect.objectContaining({ name: "Updated squat" }),
      );
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/user/workout");
    });
  });

  it("passes submitting state and closes back to workout home", async () => {
    useUpdateWorkoutLog.mockReturnValue({
      updateLog: updateLogMock,
      isPending: true,
    });
    const router = renderPage();

    expect(screen.getByTestId("drawer-is-submitting")).toHaveTextContent("true");

    fireEvent.click(screen.getByText("Close drawer"));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/user/workout");
    });
  });

  it("navigates back and shows an error when the workout log is missing", async () => {
    useWorkoutLog.mockReturnValue({
      log: null,
      isLoading: false,
    });

    const router = renderPage();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Workout log topilmadi");
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/user/workout");
    });
  });
});

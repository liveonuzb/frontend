import React from "react";
import "@/lib/i18n";
import i18n from "@/lib/i18n";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SessionHistoryDetailPage from "./index.jsx";
import {
  useDeleteWorkoutSessionHistoryItem,
  useUpdateWorkoutSessionDetails,
  useUploadWorkoutSessionMomentImage,
  useWorkoutSessionHistory,
  useWorkoutSessionHistoryItem,
} from "@/hooks/app/use-workout-sessions";

const html2canvasMock = vi.hoisted(() =>
  vi.fn(() =>
    Promise.resolve({
      toBlob: (callback) =>
        callback(new Blob(["poster"], { type: "image/webp" })),
    }),
  ),
);

vi.mock("html2canvas", () => ({
  default: html2canvasMock,
}));

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("@/components/page-loader/index.jsx", () => ({
  default: () => <div data-testid="page-loader">Loading</div>,
}));

vi.mock("../../running/components/run-map-panel.jsx", () => ({
  default: ({ polyline, points, segments, emptyLabel }) => (
    <div
      data-testid="history-running-map"
      data-polyline={polyline ?? ""}
      data-point-count={points?.length ?? 0}
      data-segment-count={segments?.length ?? 0}
      data-empty-label={emptyLabel ?? ""}
    />
  ),
}));

vi.mock("@/store", () => ({
  useBreadcrumbStore: () => ({
    setBreadcrumbs: vi.fn(),
  }),
}));

vi.mock("@/hooks/app/use-workout-sessions", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useDeleteWorkoutSessionHistoryItem: vi.fn(),
    useUpdateWorkoutSessionDetails: vi.fn(),
    useUploadWorkoutSessionMomentImage: vi.fn(),
    useWorkoutSessionHistory: vi.fn(),
    useWorkoutSessionHistoryItem: vi.fn(),
  };
});

const deleteHistoryItemMock = vi.fn();
const updateDetailsMock = vi.fn();
const uploadMomentImageMock = vi.fn();

const renderPage = (initialEntry = "/user/workout/history/session-1") => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/workout/history/:sessionId",
        element: <SessionHistoryDetailPage />,
      },
      {
        path: "/user/workout/report/:sessionId",
        element: <SessionHistoryDetailPage />,
      },
      {
        path: "/user/workout/history",
        element: <div data-testid="history-route">History route</div>,
      },
      {
        path: "/user/workout/plans/:planId/days/:dayIndex",
        element: <div data-testid="plan-day-route">Plan day route</div>,
      },
      {
        path: "/user/workout/running/:sessionId",
        element: <div data-testid="running-detail-route">Running detail route</div>,
      },
    ],
    { initialEntries: [initialEntry] },
  );

  render(<RouterProvider router={router} />);
  return router;
};

describe("SessionHistoryDetailPage", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("uz");
    html2canvasMock.mockClear();
    deleteHistoryItemMock.mockReset();
    updateDetailsMock.mockReset();
    uploadMomentImageMock.mockReset();
    updateDetailsMock.mockResolvedValue({ id: "session-1" });
    deleteHistoryItemMock.mockResolvedValue({ success: true });
    uploadMomentImageMock.mockResolvedValue({
      id: "image-1",
      url: "https://cdn.example.com/workout.jpg",
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: vi.fn().mockReturnValue(true),
    });
    useUpdateWorkoutSessionDetails.mockReturnValue({
      updateWorkoutSessionDetails: updateDetailsMock,
      isPending: false,
    });
    useDeleteWorkoutSessionHistoryItem.mockReturnValue({
      deleteWorkoutSessionHistoryItem: deleteHistoryItemMock,
      isPending: false,
    });
    useUploadWorkoutSessionMomentImage.mockReturnValue({
      uploadWorkoutSessionMomentImage: uploadMomentImageMock,
      isPending: false,
    });
    useWorkoutSessionHistoryItem.mockReturnValue({
      session: {
        id: "session-1",
        planId: "plan-1",
        planDayIndex: 0,
        planName: "Leg Power",
        focus: "Legs",
        endedAt: new Date().toISOString(),
        durationSeconds: 1500,
        estimatedCalories: 180,
        totalVolumeKg: 840,
        totalSets: 6,
        completedSets: 6,
        moments: {
          title: "Upper body win",
          text: "Strong finish.",
          imageUploadId: "image-0",
          imageUrl: "https://cdn.example.com/existing.jpg",
        },
        feeling: {
          level: 3,
        },
        skippedExerciseCount: 1,
        exerciseSummaries: [
          {
            exerciseKey: "squat-1",
            exerciseName: "Squat",
            completedSets: 3,
            totalReps: 30,
            totalVolumeKg: 840,
            distanceMeters: 0,
          },
        ],
        skippedExercises: [
          {
            exerciseKey: "lunge-1",
            exerciseName: "Lunge",
          },
        ],
        exercises: [
          {
            id: "session-exercise-1",
            exerciseKey: "squat-1",
            exerciseName: "Squat",
            equipment: "Barbell",
            completedSets: 3,
            totalSets: 3,
            totalReps: 30,
            totalVolumeKg: 840,
            distanceMeters: 0,
            skipped: false,
            sets: [
              {
                id: "session-set-1",
                setIndex: 0,
                reps: 10,
                weight: 28,
                durationSeconds: 0,
                distanceMeters: 0,
              },
            ],
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    useWorkoutSessionHistory.mockReturnValue({
      sessions: [
        { id: "session-1" },
        { id: "session-0" },
      ],
    });
  });

  it("renders the completed session details", () => {
    renderPage();

    expect(screen.getByText("Workout complete")).toBeInTheDocument();
    expect(screen.getByText("Legs")).toBeInTheDocument();
    expect(screen.getByText("Training Moments")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Upper body win")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Strong finish.")).toBeInTheDocument();
    expect(screen.getByText("Training Feeling")).toBeInTheDocument();
    expect(screen.getByText("Bajarilgan mashqlar")).toBeInTheDocument();
    expect(screen.getByText("Squat")).toBeInTheDocument();
    expect(screen.getAllByText("840 kg").length).toBeGreaterThan(0);
    expect(screen.getByText("Barbell")).toBeInTheDocument();
    expect(screen.getByText("10 reps")).toBeInTheDocument();
    expect(screen.getByText("O'tkazilgan")).toBeInTheDocument();
    expect(screen.getByText("1 ta")).toBeInTheDocument();
  });

  it("saves strength result feeling and uploaded moment image", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "x4" }));
    await waitFor(() => {
      expect(updateDetailsMock).toHaveBeenCalledWith("session-1", {
        feelingLevel: 4,
      });
    });

    const fileInput = screen.getByLabelText("Add a photo input");
    fireEvent.change(fileInput, {
      target: {
        files: [new File(["image"], "workout.jpg", { type: "image/jpeg" })],
      },
    });

    await waitFor(() => {
      expect(uploadMomentImageMock).toHaveBeenCalled();
      expect(updateDetailsMock).toHaveBeenCalledWith("session-1", {
        momentImageUploadId: "image-1",
      });
    });
  });

  it("shares the result as a poster image when native file share is available", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    await waitFor(() => {
      expect(html2canvasMock).toHaveBeenCalled();
      expect(navigator.share).toHaveBeenCalledWith(
        expect.objectContaining({
          files: [expect.any(File)],
        }),
      );
    });
  });

  it("deletes the completed activity from the result screen", async () => {
    const router = renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Delete this activity" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(deleteHistoryItemMock).toHaveBeenCalledWith("session-1");
      expect(router.state.location.pathname).toBe("/user/workout/history");
    });
  });

  it("renders skipped exercises from the completed session summary fallback", () => {
    useWorkoutSessionHistoryItem.mockReturnValue({
      session: {
        id: "session-1",
        planId: "plan-1",
        planDayIndex: 0,
        planName: "Leg Power",
        focus: "Legs",
        endedAt: new Date().toISOString(),
        durationSeconds: 1500,
        estimatedCalories: 180,
        totalVolumeKg: 840,
        totalSets: 6,
        completedSets: 3,
        skippedExerciseCount: 1,
        exerciseSummaries: [
          {
            exerciseKey: "squat-1",
            exerciseName: "Squat",
            completedSets: 3,
            totalReps: 30,
            totalVolumeKg: 840,
            distanceMeters: 0,
          },
        ],
        skippedExercises: [
          {
            exerciseKey: "lunge-1",
            exerciseName: "Lunge",
            completedSets: 0,
            totalSets: 3,
            totalReps: 0,
            totalVolumeKg: 0,
            distanceMeters: 0,
          },
        ],
        exercises: [],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText("Squat")).toBeInTheDocument();
    expect(screen.getByText("Lunge")).toBeInTheDocument();
    expect(screen.getByText("Skipped")).toBeInTheDocument();
  });

  it("navigates back to history", () => {
    const router = renderPage();

    fireEvent.click(screen.getByText("Tarix"));

    expect(router.state.location.pathname).toBe("/user/workout/history");
  });

  it("opens the related plan day", () => {
    const router = renderPage();

    fireEvent.click(screen.getByText("Plan kuni"));

    expect(router.state.location.pathname).toBe("/user/workout/plans/plan-1/days/0");
  });

  it("renders outdoor run metrics inside unified history detail", () => {
    useWorkoutSessionHistoryItem.mockReturnValue({
      session: {
        id: "run-session-1",
        activityType: "OUTDOOR_RUN",
        focus: "Outdoor run",
        endedAt: new Date().toISOString(),
        durationSeconds: 1800,
        estimatedCalories: 320,
        distanceMeters: 5000,
        averagePaceSecondsPerKm: 360,
        route: {
          polyline: "encoded-history-route",
          segments: ["segment-a", "segment-b"],
        },
        runningSession: {
          points: [
            {
              sequence: 1,
              latitude: 41.311081,
              longitude: 69.240562,
            },
            {
              sequence: 2,
              latitude: 41.320069,
              longitude: 69.240562,
            },
          ],
        },
        exerciseSummaries: [
          {
            exerciseKey: "outdoor-run",
            exerciseName: "Outdoor run",
            distanceMeters: 5000,
            durationSeconds: 1800,
            averagePaceSecondsPerKm: 360,
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useWorkoutSessionHistory.mockReturnValue({
      sessions: [{ id: "run-session-1" }],
    });

    const router = renderPage("/user/workout/history/run-session-1");

    expect(screen.getByText("Outdoor run")).toBeInTheDocument();
    expect(screen.getByText("Training Data")).toBeInTheDocument();
    expect(screen.getByText("Training Moments")).toBeInTheDocument();
    expect(screen.getByText("5.0 km")).toBeInTheDocument();
    expect(screen.getByText("6:00 /km")).toBeInTheDocument();
    expect(screen.queryByText("Bajarilgan mashqlar")).not.toBeInTheDocument();
    expect(screen.getByTestId("history-running-map")).toHaveAttribute(
      "data-polyline",
      "encoded-history-route",
    );
    expect(screen.getByTestId("history-running-map")).toHaveAttribute(
      "data-point-count",
      "2",
    );
    expect(screen.getByTestId("history-running-map")).toHaveAttribute(
      "data-segment-count",
      "2",
    );

    expect(screen.queryByText("Running detail")).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe(
      "/user/workout/history/run-session-1",
    );
  });

  it("loads the report detail alias by session id", () => {
    renderPage("/user/workout/report/session-1");

    expect(screen.getByText("Legs")).toBeInTheDocument();
    expect(screen.getByText("Bajarilgan mashqlar")).toBeInTheDocument();
  });

  it("shows a not-found state when a session cannot be loaded", () => {
    useWorkoutSessionHistoryItem.mockReturnValue({
      session: null,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    renderPage("/user/workout/history/missing-session");

    expect(screen.getByText("Workout session topilmadi")).toBeInTheDocument();
    expect(screen.getByText("Tarixga qaytish")).toBeInTheDocument();
  });
});

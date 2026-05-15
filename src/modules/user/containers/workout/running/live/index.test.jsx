import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RunningLivePage from "./index.jsx";
import {
  useAppendRunningPoints,
  useCancelRunningSession,
  useFinishRunningSession,
  usePauseRunningSession,
  useResumeRunningSession,
  useRunningActiveSession,
} from "@/hooks/app/use-running-sessions";
import {
  clearRunningPointQueue,
  enqueueRunningPoints,
  loadActiveRunningSession,
  loadRunningPointQueue,
} from "@/lib/running-offline-queue";

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key, fallback) => (typeof fallback === "string" ? fallback : _key),
  }),
}));

vi.mock("@/hooks/app/use-running-sessions", () => ({
  useAppendRunningPoints: vi.fn(),
  useCancelRunningSession: vi.fn(),
  useFinishRunningSession: vi.fn(),
  usePauseRunningSession: vi.fn(),
  useResumeRunningSession: vi.fn(),
  useRunningActiveSession: vi.fn(),
}));

vi.mock("@/lib/running-offline-queue", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    clearRunningPointQueue: vi.fn(actual.clearRunningPointQueue),
    loadActiveRunningSession: vi.fn(),
    loadRunningPointQueue: vi.fn(actual.loadRunningPointQueue),
  };
});

vi.mock("../components/run-map-panel.jsx", () => ({
  default: ({ points }) => (
    <div
      data-testid="run-map-panel"
      data-point-count={points?.length ?? 0}
      data-last-sequence={points?.at(-1)?.sequence ?? ""}
    />
  ),
}));

const renderPage = () => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/workout/running/live/:workoutSessionId",
        element: <RunningLivePage />,
      },
      {
        path: "/user/workout/running/:workoutSessionId",
        element: <div>Run detail</div>,
      },
      {
        path: "/user/workout/running",
        element: <div>Running home</div>,
      },
    ],
    { initialEntries: ["/user/workout/running/live/workout-1"] },
  );

  render(<RouterProvider router={router} />);
  return router;
};

describe("RunningLivePage", () => {
  let appendPoints;
  let finishRunningSession;
  let resumeRunningSession;
  let watchSuccess;
  let watchError;

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    loadActiveRunningSession.mockReturnValue(null);
    appendPoints = vi.fn().mockResolvedValue({
      acceptedCount: 1,
      lastAcceptedSequence: 43,
    });
    finishRunningSession = vi.fn().mockResolvedValue({
      workoutSessionId: "workout-1",
    });
    resumeRunningSession = vi.fn().mockResolvedValue({
      workoutSessionId: "workout-1",
      status: "active",
    });
    watchSuccess = null;
    watchError = null;

    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: {
        watchPosition: vi.fn((success, error) => {
          watchSuccess = success;
          watchError = error;
          return 9;
        }),
        clearWatch: vi.fn(),
      },
    });

    useRunningActiveSession.mockReturnValue({
      activeSession: {
        workoutSessionId: "workout-1",
        status: "active",
        startedAt: "2026-05-12T10:00:00.000Z",
        lastAcceptedSequence: 42,
        metrics: {
          distanceMeters: 0,
          durationSeconds: 0,
        },
      },
    });
    useAppendRunningPoints.mockReturnValue({ appendPoints });
    usePauseRunningSession.mockReturnValue({
      pauseRunningSession: vi.fn(),
      isPending: false,
    });
    useResumeRunningSession.mockReturnValue({
      resumeRunningSession,
      isPending: false,
    });
    useFinishRunningSession.mockReturnValue({
      finishRunningSession,
      isPending: false,
    });
    useCancelRunningSession.mockReturnValue({
      cancelRunningSession: vi.fn(),
      isPending: false,
    });
  });

  it("continues GPS point sequencing from the last accepted server sequence", async () => {
    renderPage();

    expect(screen.getByText("3")).toBeInTheDocument();

    await act(async () => {
      await watchSuccess({
        coords: {
          latitude: 41.311081,
          longitude: 69.240562,
          altitude: null,
          accuracy: 8,
          speed: null,
          heading: null,
        },
        timestamp: Date.parse("2026-05-12T10:01:00.000Z"),
      });
    });

    await waitFor(() => {
      expect(appendPoints).toHaveBeenCalledWith("workout-1", [
        expect.objectContaining({
          sequence: 43,
          latitude: 41.311081,
          longitude: 69.240562,
        }),
      ]);
    });
    expect(loadRunningPointQueue).toHaveBeenCalledWith("workout-1");
    await waitFor(() => {
      expect(loadRunningPointQueue("workout-1")).toEqual([]);
    });
    expect(screen.getByTestId("run-map-panel")).toHaveAttribute(
      "data-last-sequence",
      "43",
    );
  });

  it("updates live distance from browser GPS points before the run is finished", async () => {
    renderPage();

    await act(async () => {
      await watchSuccess({
        coords: {
          latitude: 41.311081,
          longitude: 69.240562,
          altitude: null,
          accuracy: 8,
          speed: null,
          heading: null,
        },
        timestamp: Date.parse("2026-05-12T10:01:00.000Z"),
      });
      await watchSuccess({
        coords: {
          latitude: 41.320081,
          longitude: 69.240562,
          altitude: null,
          accuracy: 8,
          speed: null,
          heading: null,
        },
        timestamp: Date.parse("2026-05-12T10:02:00.000Z"),
      });
    });

    expect(await screen.findByText("1.0 km")).toBeInTheDocument();
  });

  it("opens a finish confirmation and lets the user continue the run", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /yakunlash/i }));

    expect(
      screen.getByRole("dialog", { name: /finish training/i }),
    ).toBeInTheDocument();
    expect(finishRunningSession).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: /finish training/i }),
      ).toHaveAttribute("data-state", "closed");
    });
    expect(finishRunningSession).not.toHaveBeenCalled();
  });

  it("finishes the run from the confirmation dialog", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /yakunlash/i }));
    fireEvent.click(screen.getByRole("button", { name: /^finish$/i }));

    await waitFor(() => {
      expect(finishRunningSession).toHaveBeenCalledWith(
        "workout-1",
        expect.objectContaining({
          finalPointSequence: 42,
        }),
      );
    });
  });

  it("guards finish while queued GPS points fail to sync and retries after sync succeeds", async () => {
    appendPoints
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        acceptedCount: 1,
        lastAcceptedSequence: 43,
      });
    enqueueRunningPoints("workout-1", [
      {
        sequence: 43,
        latitude: 41.311081,
        longitude: 69.240562,
        sourceTimestamp: "2026-05-12T10:01:00.000Z",
      },
    ]);
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /yakunlash/i }));
    fireEvent.click(screen.getByRole("button", { name: /^finish$/i }));

    await waitFor(() => {
      expect(appendPoints).toHaveBeenCalledWith("workout-1", [
        expect.objectContaining({
          sequence: 43,
        }),
      ]);
    });
    expect(screen.getAllByText(/sync navbat/i).length).toBeGreaterThan(0);
    expect(finishRunningSession).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /^finish$/i }));

    await waitFor(() => {
      expect(finishRunningSession).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ finishedAt: expect.any(String) }),
      );
    });
    expect(clearRunningPointQueue).toHaveBeenCalledWith("workout-1");
  });

  it("keeps newer GPS points queued while an upload is already in flight", async () => {
    let resolveFirstAppend;
    appendPoints.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirstAppend = resolve;
        }),
    );
    renderPage();

    await act(async () => {
      const firstPoint = watchSuccess({
        coords: {
          latitude: 41.311081,
          longitude: 69.240562,
          altitude: null,
          accuracy: 8,
          speed: null,
          heading: null,
        },
        timestamp: Date.parse("2026-05-12T10:01:00.000Z"),
      });
      const secondPoint = watchSuccess({
        coords: {
          latitude: 41.320081,
          longitude: 69.240562,
          altitude: null,
          accuracy: 8,
          speed: null,
          heading: null,
        },
        timestamp: Date.parse("2026-05-12T10:02:00.000Z"),
      });
      await Promise.resolve();

      expect(appendPoints).toHaveBeenCalledTimes(1);
      expect(
        loadRunningPointQueue("workout-1").map((point) => point.sequence),
      ).toEqual([43, 44]);

      resolveFirstAppend({
        acceptedCount: 1,
        lastAcceptedSequence: 43,
      });
      await Promise.resolve(firstPoint);
      await Promise.resolve(secondPoint);
    });

    await waitFor(() => {
      expect(
        loadRunningPointQueue("workout-1").map((point) => point.sequence),
      ).toEqual([44]);
    });

    fireEvent.click(screen.getByRole("button", { name: /pauza/i }));

    await waitFor(() => {
      expect(appendPoints).toHaveBeenCalledTimes(2);
    });
    expect(appendPoints.mock.calls[1][1]).toEqual([
      expect.objectContaining({
        sequence: 44,
      }),
    ]);
  });

  it("pauses even when queued GPS points are still retrying", async () => {
    const pauseRunningSession = vi.fn().mockResolvedValue({
      workoutSessionId: "workout-1",
      status: "paused",
    });
    appendPoints.mockRejectedValueOnce({
      response: {
        status: 429,
        headers: {
          "retry-after-short": "1",
        },
      },
    });
    usePauseRunningSession.mockReturnValue({
      pauseRunningSession,
      isPending: false,
    });
    enqueueRunningPoints("workout-1", [
      {
        sequence: 43,
        latitude: 41.311081,
        longitude: 69.240562,
        sourceTimestamp: "2026-05-12T10:01:00.000Z",
      },
    ]);
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /pauza/i }));

    await waitFor(() => {
      expect(pauseRunningSession).toHaveBeenCalledWith("workout-1");
    });
    expect(await screen.findByText("Pauzada")).toBeInTheDocument();
    expect(screen.getByText("Sync navbatda")).toBeInTheDocument();
    expect(window.navigator.geolocation.clearWatch).toHaveBeenCalledWith(9);
  });

  it("clears the GPS watcher on pause and starts tracking again on resume", async () => {
    const pauseRunningSession = vi.fn().mockResolvedValue({
      workoutSessionId: "workout-1",
      status: "paused",
    });
    usePauseRunningSession.mockReturnValue({
      pauseRunningSession,
      isPending: false,
    });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /pauza/i }));

    await waitFor(() => {
      expect(window.navigator.geolocation.clearWatch).toHaveBeenCalled();
    });
    expect(await screen.findByText("Pauzada")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /davom ettirish|resume/i }),
    );

    await waitFor(() => {
      expect(resumeRunningSession).toHaveBeenCalledWith("workout-1");
    });
    await waitFor(() => {
      expect(window.navigator.geolocation.watchPosition).toHaveBeenCalledTimes(
        2,
      );
    });
  });

  it("does not finish when final point sync is rate limited", async () => {
    appendPoints.mockRejectedValueOnce({
      response: {
        status: 429,
        headers: {
          "retry-after-short": "1",
        },
      },
    });
    enqueueRunningPoints("workout-1", [
      {
        sequence: 43,
        latitude: 41.311081,
        longitude: 69.240562,
        sourceTimestamp: "2026-05-12T10:01:00.000Z",
      },
    ]);

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /yakunlash/i }));
    fireEvent.click(screen.getByRole("button", { name: /^finish$/i }));

    await waitFor(() => {
      expect(appendPoints).toHaveBeenCalled();
    });
    expect(screen.getAllByText(/sync navbat/i).length).toBeGreaterThan(0);
    expect(finishRunningSession).not.toHaveBeenCalled();
    expect(clearRunningPointQueue).not.toHaveBeenCalled();
  });

  it("requires confirmation before cancelling a run", async () => {
    const cancelRunningSession = vi.fn().mockResolvedValue({
      success: true,
    });
    useCancelRunningSession.mockReturnValue({
      cancelRunningSession,
      isPending: false,
    });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /bekor qilish/i }));

    expect(cancelRunningSession).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: /yugurishni bekor qilish/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /ha, bekor qilish/i }));

    await waitFor(() => {
      expect(cancelRunningSession).toHaveBeenCalledWith("workout-1", {
        reason: "user_cancelled",
      });
    });
  });

  it("continues GPS point sequencing from a locally saved active session after reload", async () => {
    useRunningActiveSession.mockReturnValue({
      activeSession: null,
    });
    loadActiveRunningSession.mockReturnValue({
      workoutSessionId: "workout-1",
      status: "active",
      startedAt: "2026-05-12T10:00:00.000Z",
      lastAcceptedSequence: 42,
      metrics: {
        distanceMeters: 0,
        durationSeconds: 0,
      },
    });
    renderPage();

    await act(async () => {
      await watchSuccess({
        coords: {
          latitude: 41.311081,
          longitude: 69.240562,
          altitude: null,
          accuracy: 8,
          speed: null,
          heading: null,
        },
        timestamp: Date.parse("2026-05-12T10:01:00.000Z"),
      });
    });

    await waitFor(() => {
      expect(appendPoints).toHaveBeenCalledWith("workout-1", [
        expect.objectContaining({
          sequence: 43,
          latitude: 41.311081,
          longitude: 69.240562,
        }),
      ]);
    });
  });

  it("lets the user retry GPS watching after a permission or timeout error", async () => {
    renderPage();

    act(() => {
      watchError();
    });

    expect(screen.getByText("GPS ruxsati kerak")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /gps qayta urinish/i }));

    await waitFor(() => {
      expect(window.navigator.geolocation.watchPosition).toHaveBeenCalledTimes(
        2,
      );
    });
  });

  it("shows GPS unavailable when the browser geolocation API is incomplete", () => {
    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: {},
    });

    renderPage();

    expect(screen.getByText("GPS mavjud emas")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /gps qayta urinish/i }),
    ).toBeInTheDocument();
  });
});

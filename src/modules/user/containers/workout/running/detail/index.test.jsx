import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RunningDetailPage from "./index.jsx";
import { usePostQuery } from "@/hooks/api";
import useMe from "@/hooks/app/use-me";
import {
  useDeleteRunningSession,
  useRunningSessionDetail,
  useUpdateRunningSessionDetails,
} from "@/hooks/app/use-running-sessions";
import useShare from "@/hooks/utils/use-share";

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

vi.mock("@/components/page-loader/index.jsx", () => ({
  default: () => <div data-testid="page-loader">Loading</div>,
}));

vi.mock("@/hooks/api", () => ({
  usePostQuery: vi.fn(),
}));

vi.mock("@/hooks/app/use-me", () => ({
  default: vi.fn(),
}));

vi.mock("@/hooks/app/use-running-sessions", () => ({
  useDeleteRunningSession: vi.fn(),
  useRunningSessionDetail: vi.fn(),
  useUpdateRunningSessionDetails: vi.fn(),
}));

vi.mock("@/hooks/utils/use-share", () => ({
  default: vi.fn(),
}));

vi.mock("../components/run-map-panel.jsx", () => ({
  default: ({ polyline, points, emptyLabel }) => (
    <div
      data-testid="run-map-panel"
      data-polyline={polyline ?? ""}
      data-point-count={points?.length ?? 0}
      data-empty-label={emptyLabel}
    />
  ),
}));

const sessionFixture = {
  workoutSessionId: "workout-1",
  startedAt: "2026-05-15T06:53:00.000Z",
  endedAt: "2026-05-15T06:54:00.000Z",
  metrics: {
    distanceMeters: 10,
    durationSeconds: 51,
    movingDurationSeconds: 10,
    caloriesBurned: 1,
    averagePaceSecondsPerKm: 675,
    averageSpeedKmh: 5.33,
    elevationGainMeters: 443,
  },
  route: {
    polyline: "encoded-route",
  },
  moments: {
    title: "",
    text: "",
    imageUploadId: null,
    imageUrl: null,
  },
  feeling: {
    level: 1,
  },
  bodyMetrics: {
    heightCm: 178,
    weightKg: 74,
  },
  points: [
    {
      sequence: 1,
      latitude: 41.311081,
      longitude: 69.240562,
    },
  ],
};

const renderPage = () => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/workout/running/:workoutSessionId",
        element: <RunningDetailPage />,
      },
      {
        path: "/user/workout/running",
        element: <div>Running home</div>,
      },
    ],
    { initialEntries: ["/user/workout/running/workout-1"] },
  );

  render(<RouterProvider router={router} />);
  return router;
};

describe("RunningDetailPage", () => {
  let updateRunningSessionDetails;
  let deleteRunningSession;
  let uploadImage;
  let share;

  beforeEach(() => {
    vi.clearAllMocks();
    updateRunningSessionDetails = vi.fn().mockResolvedValue(sessionFixture);
    deleteRunningSession = vi.fn().mockResolvedValue({ success: true });
    uploadImage = vi.fn().mockResolvedValue({
      data: {
        data: {
          id: "image-1",
          url: "https://cdn.example.com/run.jpg",
        },
      },
    });
    share = vi.fn();

    useMe.mockReturnValue({
      user: {
        profile: {
          firstName: "Shoxrux",
          lastName: "Shomurodov",
        },
      },
    });
    useRunningSessionDetail.mockReturnValue({
      isLoading: false,
      session: sessionFixture,
    });
    useUpdateRunningSessionDetails.mockReturnValue({
      updateRunningSessionDetails,
      isPending: false,
    });
    useDeleteRunningSession.mockReturnValue({
      deleteRunningSession,
      isPending: false,
    });
    usePostQuery.mockReturnValue({
      mutateAsync: uploadImage,
      isPending: false,
    });
    useShare.mockReturnValue({ share });
  });

  it("renders the running result layout with route, data, moments, feeling, and body metrics", () => {
    renderPage();

    expect(screen.getByText("Shoxrux Shomurodov")).toBeInTheDocument();
    expect(screen.getByText("0.01")).toBeInTheDocument();
    expect(screen.getByText("Training Data")).toBeInTheDocument();
    expect(screen.getByText("Training Moments")).toBeInTheDocument();
    expect(screen.getByText("Training Feeling")).toBeInTheDocument();
    expect(screen.getByText("Height / Weight")).toBeInTheDocument();
    expect(screen.getByText("Delete this activity")).toBeInTheDocument();
    expect(screen.getByTestId("run-map-panel")).toHaveAttribute(
      "data-polyline",
      "encoded-route",
    );
    expect(screen.getByTestId("run-map-panel")).toHaveAttribute(
      "data-point-count",
      "1",
    );
  });

  it("does not loop when normalized session identity changes between renders", async () => {
    useRunningSessionDetail.mockImplementation(() => ({
      isLoading: false,
      session: {
        ...sessionFixture,
        metrics: { ...sessionFixture.metrics },
        route: { ...sessionFixture.route },
        moments: { ...sessionFixture.moments },
        feeling: { ...sessionFixture.feeling },
        bodyMetrics: { ...sessionFixture.bodyMetrics },
        points: sessionFixture.points.map((point) => ({ ...point })),
      },
    }));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Training Data")).toBeInTheDocument();
    });
    expect(useRunningSessionDetail.mock.calls.length).toBeLessThan(10);
  });

  it("saves title, text, feeling, height, and weight changes", async () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText("Add a title"), {
      target: { value: "Morning run" },
    });
    fireEvent.blur(screen.getByPlaceholderText("Add a title"));

    fireEvent.change(screen.getByPlaceholderText("Add text"), {
      target: { value: "Easy warmup." },
    });
    fireEvent.blur(screen.getByPlaceholderText("Add text"));

    fireEvent.click(screen.getByRole("button", { name: /x3/i }));

    fireEvent.change(screen.getByPlaceholderText("170"), {
      target: { value: "180" },
    });
    fireEvent.blur(screen.getByPlaceholderText("170"));

    fireEvent.change(screen.getByPlaceholderText("70"), {
      target: { value: "75" },
    });
    fireEvent.blur(screen.getByPlaceholderText("70"));

    await waitFor(() => {
      expect(updateRunningSessionDetails).toHaveBeenCalledWith("workout-1", {
        momentTitle: "Morning run",
      });
    });
    expect(updateRunningSessionDetails).toHaveBeenCalledWith("workout-1", {
      momentText: "Easy warmup.",
    });
    expect(updateRunningSessionDetails).toHaveBeenCalledWith("workout-1", {
      feelingLevel: 3,
    });
    expect(updateRunningSessionDetails).toHaveBeenCalledWith("workout-1", {
      heightCm: 180,
    });
    expect(updateRunningSessionDetails).toHaveBeenCalledWith("workout-1", {
      weightKg: 75,
    });
  });

  it("uploads a moment photo through the existing media endpoint", async () => {
    renderPage();

    const file = new File(["image"], "run.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/add a photo/i), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(uploadImage).toHaveBeenCalledWith({
        url: "/user/media/images",
        attributes: expect.any(FormData),
      });
    });
    await waitFor(() => {
      expect(updateRunningSessionDetails).toHaveBeenCalledWith("workout-1", {
        momentImageUploadId: "image-1",
      });
    });
  });

  it("shares the current activity URL", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /share/i }));

    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Running activity",
        text: "0.01 KM",
      }),
    );
  });

  it("hard deletes the activity after confirmation", async () => {
    const router = renderPage();

    fireEvent.click(
      screen.getByRole("button", { name: /delete this activity/i }),
    );
    expect(
      screen.getByRole("dialog", { name: /activity o'chirilsinmi/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => {
      expect(deleteRunningSession).toHaveBeenCalledWith("workout-1");
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/user/workout/running");
    });
  });
});

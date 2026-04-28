import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  useLocation,
} from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CreateWorkoutPlanPage from "./index.jsx";
import {
  useCreateWorkoutPlan,
  useGenerateWorkoutPlan,
  useWorkoutCatalog,
} from "@/hooks/app/use-workout-plans";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("@/store", () => ({
  useBreadcrumbStore: () => ({
    setBreadcrumbs: vi.fn(),
  }),
}));

vi.mock("@/hooks/app/use-workout-plans", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useCreateWorkoutPlan: vi.fn(),
    useGenerateWorkoutPlan: vi.fn(),
    useWorkoutCatalog: vi.fn(),
  };
});

const createPlanMock = vi.fn();
const generatePlanMock = vi.fn();

const LocationLayout = () => {
  const location = useLocation();

  return (
    <div>
      <div data-testid="location">{`${location.pathname}${location.search}`}</div>
      <div data-testid="route-state">
        {JSON.stringify(location.state ?? null)}
      </div>
      <Outlet />
    </div>
  );
};

const renderPage = (initialEntry) => {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <LocationLayout />,
        children: [
          {
            path: "user/workout/plans",
            element: <div data-testid="plans-route">Plans route</div>,
          },
          {
            path: "user/workout/plans/create",
            element: <CreateWorkoutPlanPage />,
          },
          {
            path: "user/workout/plans/:planId",
            element: <div data-testid="detail-route">Detail route</div>,
          },
          {
            path: "user/workout/plans/edit/:planId",
            element: <div data-testid="edit-route">Edit route</div>,
          },
        ],
      },
    ],
    { initialEntries: [initialEntry] },
  );

  render(<RouterProvider router={router} />);

  return router;
};

describe("CreateWorkoutPlanPage", () => {
  beforeEach(() => {
    createPlanMock.mockReset();
    generatePlanMock.mockReset();
    useCreateWorkoutPlan.mockReturnValue({
      createPlan: createPlanMock,
      isPending: false,
    });
    useGenerateWorkoutPlan.mockReturnValue({
      generatePlan: generatePlanMock,
      isPending: false,
    });
    useWorkoutCatalog.mockReturnValue({
      catalog: {
        equipments: [
          { id: 1, name: "Barbell" },
          { id: 2, name: "Dumbbell" },
        ],
        muscles: [
          { id: 10, name: "Chest" },
          { id: 11, name: "Back" },
        ],
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("opens as a full page and preserves template defaults", () => {
    renderPage({
      pathname: "/user/workout/plans/create",
      state: {
        initialPlan: {
          name: "Template plan",
          description: "Template description",
        },
      },
    });

    expect(screen.getByDisplayValue("Template plan")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Template description")).toBeInTheDocument();
    expect(screen.getByText("Manual")).toBeInTheDocument();
  });

  it("creates a draft and redirects to the full edit page", async () => {
    createPlanMock.mockResolvedValue({
      id: "plan-42",
      name: "Template plan",
      description: "Template description",
      schedule: [{ day: "Dushanba", exercises: [] }],
    });

    renderPage({
      pathname: "/user/workout/plans/create",
      state: {
        initialPlan: {
          name: "Template plan",
          description: "Template description",
          difficulty: "O'rta",
          schedule: [{ day: "Dushanba", exercises: [] }],
          source: "template",
        },
      },
    });

    fireEvent.click(screen.getByText("Keyingi"));

    await waitFor(() => {
      expect(createPlanMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Template plan",
          description: "Template description",
          difficulty: "O'rta",
          schedule: [{ day: "Dushanba", exercises: [] }],
          source: "template",
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/user/workout/plans/edit/plan-42",
      );
    });
    expect(screen.getByTestId("route-state")).toHaveTextContent(
      "\"shouldActivateOnSave\":true",
    );
  });

  it("generates and saves an AI preview with 1RM data", async () => {
    generatePlanMock.mockResolvedValue({
      id: null,
      name: "AI Upper",
      description: "Generated plan",
      days: 28,
      daysPerWeek: 4,
      schedule: [{ day: "Dushanba", focus: "Chest", exercises: [] }],
      generationMeta: {
        benchmark: {
          oneRepMaxKg: 46,
        },
      },
      source: "ai",
    });
    createPlanMock.mockResolvedValue({
      id: "ai-plan-1",
      name: "AI Upper",
    });

    renderPage({ pathname: "/user/workout/plans/create" });

    fireEvent.click(screen.getByRole("tab", { name: /AI Generate/i }));

    await screen.findByText("AI plan sozlamalari");
    fireEvent.click(screen.getByRole("button", { name: /Generate plan/i }));

    await waitFor(() => {
      expect(generatePlanMock).toHaveBeenCalledWith(
        expect.objectContaining({
          benchmark: expect.objectContaining({
            exerciseName: "Bench Press",
            weightKg: 40,
            reps: 5,
            oneRepMaxKg: 46,
          }),
        }),
      );
    });

    await screen.findByText("AI Upper");
    fireEvent.click(screen.getByText("Saqlash"));

    await waitFor(() => {
      expect(createPlanMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "AI Upper",
          source: "ai",
          generationMeta: expect.objectContaining({
            benchmark: expect.objectContaining({
              oneRepMaxKg: 46,
            }),
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/user/workout/plans/ai-plan-1",
      );
    });
  });
});

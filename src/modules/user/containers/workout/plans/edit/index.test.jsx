import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  useLocation,
} from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EditWorkoutPlanPage from "./index.jsx";
import {
  useActivateWorkoutPlan,
  useUpdateWorkoutPlan,
  useWorkoutPlanDetail,
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

vi.mock("@/components/page-loader/index.jsx", () => ({
  default: () => <div data-testid="page-loader">Loading</div>,
}));

vi.mock("@/components/workout-plan-builder", () => ({
  default: ({
    initialPlan,
    metaName,
    metaDescription,
    onMetaSave,
    onSave,
    asPage,
    title,
  }) => (
    <div data-testid="builder" data-as-page={String(asPage)}>
      <div data-testid="builder-title">{title}</div>
      <div data-testid="builder-meta-name">{metaName}</div>
      <div data-testid="builder-meta-description">{metaDescription}</div>
      <button
        onClick={() =>
          onMetaSave({
            name: "Edited plan name",
            description: "Edited description",
          })
        }
      >
        edit-builder-meta
      </button>
      <button
        onClick={() =>
          onSave({
            ...initialPlan,
            name: "Builder saved plan",
            description: "Builder saved description",
            schedule: [{ day: "Seshanba", exercises: [] }],
          })
        }
      >
        save-builder
      </button>
    </div>
  ),
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
    useActivateWorkoutPlan: vi.fn(),
    useUpdateWorkoutPlan: vi.fn(),
    useWorkoutPlanDetail: vi.fn(),
  };
});

const updatePlanMock = vi.fn();
const activatePlanMock = vi.fn();
const refetchMock = vi.fn();

const defaultPlan = {
  id: "plan-1",
  name: "Starter plan",
  description: "Starter description",
  difficulty: "O'rta",
  schedule: [{ day: "Dushanba", exercises: [] }],
};

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
            path: "user/workout/plans/:planId",
            element: <div data-testid="detail-route">Detail route</div>,
          },
          {
            path: "user/workout/plans/edit/:planId",
            element: <EditWorkoutPlanPage />,
          },
        ],
      },
    ],
    { initialEntries: [initialEntry] },
  );

  render(<RouterProvider router={router} />);

  return router;
};

describe("EditWorkoutPlanPage", () => {
  beforeEach(() => {
    updatePlanMock.mockReset();
    activatePlanMock.mockReset();
    refetchMock.mockReset();

    useWorkoutPlanDetail.mockReturnValue({
      plan: defaultPlan,
      isLoading: false,
      isError: false,
      refetch: refetchMock,
    });
    useUpdateWorkoutPlan.mockReturnValue({
      updatePlan: updatePlanMock,
      isPending: false,
    });
    useActivateWorkoutPlan.mockReturnValue({
      activatePlan: activatePlanMock,
      isPending: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders as a full page with metadata handled by the builder", () => {
    renderPage({ pathname: "/user/workout/plans/edit/plan-1" });

    expect(screen.queryByText("Plan ma'lumotlari")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Plan nomi")).not.toBeInTheDocument();
    expect(screen.getByTestId("builder")).toHaveAttribute("data-as-page", "true");
    expect(screen.getByTestId("builder-title")).toHaveTextContent("Starter plan");
    expect(screen.getByTestId("builder-meta-name")).toHaveTextContent(
      "Starter plan",
    );
    expect(screen.getByTestId("builder-meta-description")).toHaveTextContent(
      "Starter description",
    );
  });

  it("updates metadata through the builder and saves it with the plan", async () => {
    updatePlanMock.mockResolvedValue({
      ...defaultPlan,
      name: "Edited plan name",
      description: "Edited description",
    });

    renderPage({ pathname: "/user/workout/plans/edit/plan-1" });

    fireEvent.click(screen.getByText("edit-builder-meta"));
    fireEvent.click(screen.getByText("save-builder"));

    await waitFor(() => {
      expect(updatePlanMock).toHaveBeenCalledWith(
        "plan-1",
        expect.objectContaining({
          name: "Edited plan name",
          description: "Edited description",
          schedule: [{ day: "Seshanba", exercises: [] }],
        }),
      );
    });

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/user/workout/plans/plan-1",
    );
  });

  it("updates and activates a newly created draft on builder save", async () => {
    const callOrder = [];

    updatePlanMock.mockImplementation(async (_planId, plan) => {
      callOrder.push("update");
      return {
        ...defaultPlan,
        ...plan,
      };
    });
    activatePlanMock.mockImplementation(async () => {
      callOrder.push("activate");
      return {
        ...defaultPlan,
        status: "active",
      };
    });

    renderPage({
      pathname: "/user/workout/plans/edit/plan-1",
      state: {
        initialPlan: defaultPlan,
        shouldActivateOnSave: true,
      },
    });

    fireEvent.click(screen.getByText("save-builder"));

    await waitFor(() => {
      expect(updatePlanMock).toHaveBeenCalledWith(
        "plan-1",
        expect.objectContaining({
          name: "Starter plan",
          description: "Starter description",
          schedule: [{ day: "Seshanba", exercises: [] }],
        }),
      );
    });

    await waitFor(() => {
      expect(activatePlanMock).toHaveBeenCalledWith(
        "plan-1",
        expect.objectContaining({
          name: "Starter plan",
          schedule: [{ day: "Seshanba", exercises: [] }],
        }),
      );
    });

    expect(callOrder).toEqual(["update", "activate"]);
    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/user/workout/plans/plan-1",
      );
    });
  });
});

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

vi.mock("../../workout-plan-form-drawer.jsx", () => ({
  default: ({
    mode,
    view,
    metaName,
    metaDescription,
    onMetaNameChange,
    onMetaDescriptionChange,
    onMetaSubmit,
    onBuilderSave,
    onBuilderBack,
    onOpenChange,
  }) => (
    <div>
      <div data-testid="drawer-mode">{`${mode}:${view}`}</div>
      <div data-testid="meta-name">{metaName}</div>
      <div data-testid="meta-description">{metaDescription}</div>
      <button onClick={() => onMetaNameChange("Edited plan name")}>
        change-name
      </button>
      <button onClick={() => onMetaDescriptionChange("Edited description")}>
        change-description
      </button>
      <button onClick={() => onMetaSubmit?.()}>submit-meta</button>
      <button
        onClick={() =>
          onBuilderSave?.({
            name: "Builder saved plan",
            description: "Builder saved description",
            schedule: [{ day: "Seshanba", exercises: [] }],
          })
        }
      >
        save-builder
      </button>
      <button onClick={() => onBuilderBack?.()}>builder-back</button>
      <button onClick={() => onOpenChange?.(false)}>close-drawer</button>
    </div>
  ),
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
            path: "user/workout",
            element: <div data-testid="workout-parent">Workout parent</div>,
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

  it("opens the meta step first on the canonical edit route", () => {
    renderPage({
      pathname: "/user/workout/plans/edit/plan-1",
      search: "?tab=plans&date=2026-04-14",
    });

    expect(screen.getByTestId("drawer-mode")).toHaveTextContent("edit:meta");
    expect(screen.getByTestId("meta-name")).toHaveTextContent("Starter plan");
  });

  it("sanitizes invalid step values back to the meta route", async () => {
    renderPage({
      pathname: "/user/workout/plans/edit/plan-1",
      search: "?tab=plans&step=invalid",
    });

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/user/workout/plans/edit/plan-1?tab=plans",
      );
    });

    expect(screen.getByTestId("drawer-mode")).toHaveTextContent("edit:meta");
  });

  it("patches meta and navigates to the builder step while preserving search params", async () => {
    updatePlanMock.mockResolvedValue({
      ...defaultPlan,
      name: "Edited plan name",
      description: "Edited description",
    });

    renderPage({
      pathname: "/user/workout/plans/edit/plan-1",
      search: "?tab=plans&date=2026-04-14",
    });

    fireEvent.click(screen.getByText("change-name"));
    fireEvent.click(screen.getByText("change-description"));
    fireEvent.click(screen.getByText("submit-meta"));

    await waitFor(() => {
      expect(updatePlanMock).toHaveBeenCalledWith(
        "plan-1",
        expect.objectContaining({
          name: "Edited plan name",
          description: "Edited description",
          difficulty: "O'rta",
          schedule: [{ day: "Dushanba", exercises: [] }],
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/user/workout/plans/edit/plan-1?tab=plans&date=2026-04-14&step=builder",
      );
    });
  });

  it("returns from builder to the meta step without dropping the parent search params", async () => {
    renderPage({
      pathname: "/user/workout/plans/edit/plan-1",
      search: "?tab=plans&date=2026-04-14&step=builder",
      state: {
        initialPlan: defaultPlan,
        shouldActivateOnSave: true,
      },
    });

    expect(screen.getByTestId("drawer-mode")).toHaveTextContent("create:builder");

    fireEvent.click(screen.getByText("builder-back"));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/user/workout/plans/edit/plan-1?tab=plans&date=2026-04-14",
      );
    });

    expect(screen.getByTestId("drawer-mode")).toHaveTextContent("create:meta");
  });

  it("updates and activates a created draft on final builder save, then closes to the parent route", async () => {
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
      search: "?tab=plans&date=2026-04-14&step=builder",
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
          name: "Builder saved plan",
          schedule: [{ day: "Seshanba", exercises: [] }],
        }),
      );
    });

    await waitFor(() => {
      expect(activatePlanMock).toHaveBeenCalledWith(
        "plan-1",
        expect.objectContaining({
          name: "Builder saved plan",
          schedule: [{ day: "Seshanba", exercises: [] }],
        }),
      );
    });

    expect(callOrder).toEqual(["update", "activate"]);

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/user/workout?tab=plans&date=2026-04-14",
      );
    });
  });
});

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
import { useCreateWorkoutPlan } from "@/hooks/app/use-workout-plans";

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
    onOpenChange,
  }) => (
    <div>
      <div data-testid="drawer-mode">{`${mode}:${view}`}</div>
      <div data-testid="meta-name">{metaName}</div>
      <div data-testid="meta-description">{metaDescription}</div>
      <button onClick={() => onMetaNameChange("Updated template name")}>
        change-name
      </button>
      <button onClick={() => onMetaDescriptionChange("Updated description")}>
        change-description
      </button>
      <button onClick={() => onMetaSubmit()}>submit-meta</button>
      <button onClick={() => onOpenChange(false)}>close-drawer</button>
    </div>
  ),
}));

vi.mock("@/hooks/app/use-workout-plans", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useCreateWorkoutPlan: vi.fn(),
  };
});

const createPlanMock = vi.fn();

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
            path: "user/workout/plans/create",
            element: <CreateWorkoutPlanPage />,
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
    useCreateWorkoutPlan.mockReturnValue({
      createPlan: createPlanMock,
      isPending: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("opens the meta step first and preserves template defaults", () => {
    renderPage({
      pathname: "/user/workout/plans/create",
      search: "?tab=plans&date=2026-04-14",
      state: {
        initialPlan: {
          name: "Template plan",
          description: "Template description",
        },
      },
    });

    expect(screen.getByTestId("drawer-mode")).toHaveTextContent("create:meta");
    expect(screen.getByTestId("meta-name")).toHaveTextContent("Template plan");
    expect(screen.getByTestId("meta-description")).toHaveTextContent(
      "Template description",
    );
  });

  it("creates a draft and redirects to the builder route while preserving search params", async () => {
    createPlanMock.mockResolvedValue({
      id: "plan-42",
      name: "Updated template name",
      description: "Updated description",
      schedule: [{ day: "Dushanba", exercises: [] }],
    });

    renderPage({
      pathname: "/user/workout/plans/create",
      search: "?tab=plans&date=2026-04-14",
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

    fireEvent.click(screen.getByText("change-name"));
    fireEvent.click(screen.getByText("change-description"));
    fireEvent.click(screen.getByText("submit-meta"));

    await waitFor(() => {
      expect(createPlanMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Updated template name",
          description: "Updated description",
          difficulty: "O'rta",
          schedule: [{ day: "Dushanba", exercises: [] }],
          source: "template",
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/user/workout/plans/edit/plan-42?tab=plans&date=2026-04-14&step=builder",
      );
    });

    expect(screen.getByTestId("route-state")).toHaveTextContent(
      "\"shouldActivateOnSave\":true",
    );
  });

  it("closes back to the workout parent while preserving the parent search params", async () => {
    renderPage({
      pathname: "/user/workout/plans/create",
      search: "?tab=history&date=2026-04-14",
    });

    fireEvent.click(screen.getByText("close-drawer"));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/user/workout?tab=history&date=2026-04-14",
      );
    });
  });
});

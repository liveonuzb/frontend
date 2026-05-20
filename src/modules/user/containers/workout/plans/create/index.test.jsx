import React from "react";
import "@/lib/i18n";
import i18n from "@/lib/i18n";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  useLocation,
} from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import CreateWorkoutPlanPage from "./index.jsx";
import { usePostFileQuery } from "@/hooks/api";
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

vi.mock("@/components/workout-plan-builder", () => ({
  default: ({ title, onSave }) => (
    <div data-testid="workout-builder">
      <h2>{title}</h2>
      <button
        type="button"
        onClick={() =>
          onSave({
            name: title,
            description: "",
            days: 28,
            daysPerWeek: 1,
            schedule: [{ day: "Day 1", focus: "Chest", exercises: [] }],
          })
        }
      >
        Save builder
      </button>
    </div>
  ),
}));

vi.mock("@/store", () => ({
  useBreadcrumbStore: () => ({
    setBreadcrumbs: vi.fn(),
  }),
}));

vi.mock("@/hooks/api", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    usePostFileQuery: vi.fn(),
  };
});

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
const uploadMock = vi.fn();

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

  const view = render(<RouterProvider router={router} />);

  return { router, ...view };
};

describe("CreateWorkoutPlanPage", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("uz");
    createPlanMock.mockReset();
    generatePlanMock.mockReset();
    uploadMock.mockReset();
    useCreateWorkoutPlan.mockReturnValue({
      createPlan: createPlanMock,
      isPending: false,
    });
    useGenerateWorkoutPlan.mockReturnValue({
      generatePlan: generatePlanMock,
      isPending: false,
    });
    usePostFileQuery.mockReturnValue({
      mutateAsync: uploadMock,
      isPending: false,
    });
    useWorkoutCatalog.mockReturnValue({
      catalog: {
        equipments: [
          { id: 1, name: "Barbell", imageUrl: null },
          { id: 2, name: "Dumbbell", imageUrl: null },
        ],
        muscles: [
          { id: 10, name: "Chest" },
          { id: 11, name: "Back" },
        ],
        bodyParts: [],
        exercises: [
          {
            id: 5,
            name: "Bench Press",
            imageUrl: "https://cdn.example.com/bench.jpg",
          },
        ],
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("opens the meta drawer and preserves template defaults", () => {
    renderPage({
      pathname: "/user/workout/plans/create",
      state: {
        initialPlan: {
          name: "Template plan",
          description: "Template description",
          coverImageUrl: "https://cdn.example.com/template.jpg",
        },
      },
    });

    expect(screen.getByText("Yangi workout plan")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Template plan")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Template description")).toBeInTheDocument();
    expect(screen.queryByText("Manual")).not.toBeInTheDocument();
  });

  it("creates a draft plan and opens the edit builder route", async () => {
    createPlanMock.mockResolvedValue({
      id: "plan-42",
      name: "Upper day",
      description: "Upper description",
      coverImageUrl: null,
      schedule: [],
    });

    renderPage({ pathname: "/user/workout/plans/create" });

    fireEvent.change(screen.getByLabelText("Plan nomi"), {
      target: { value: "Upper day" },
    });
    fireEvent.change(screen.getByLabelText("Izoh"), {
      target: { value: "Upper description" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(createPlanMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Upper day",
          description: "Upper description",
          source: "manual",
          schedule: [],
        }),
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/user/workout/plans/edit/plan-42",
      );
    });
    expect(screen.getByTestId("route-state")).toHaveTextContent(
      "shouldActivateOnSave",
    );
  });

  it("shows backend validation details when draft creation fails", async () => {
    createPlanMock.mockRejectedValue({
      response: {
        data: {
          error: {
            message: "Validation failed",
            details: [{ message: "difficulty must be one of canonical values" }],
          },
        },
      },
    });

    renderPage({ pathname: "/user/workout/plans/create" });

    fireEvent.change(screen.getByLabelText("Plan nomi"), {
      target: { value: "Upper day" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "difficulty must be one of canonical values",
      );
    });
  });

  it("shows an inline name validation error and does not create a blank plan", () => {
    renderPage({ pathname: "/user/workout/plans/create" });

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(screen.getByText("Reja nomini kiriting")).toBeInTheDocument();
    expect(createPlanMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: "AI bilan yaratish" })[0]);

    expect(screen.getByText("Reja nomini kiriting")).toBeInTheDocument();
    expect(generatePlanMock).not.toHaveBeenCalled();
  });

  it("uploads a custom cover and includes coverImageUrl in the manual save payload", async () => {
    uploadMock.mockResolvedValue({
      data: {
        url: "https://cdn.example.com/uploaded.jpg",
      },
    });
    createPlanMock.mockResolvedValue({
      id: "plan-cover",
      name: "Cover plan",
    });
    renderPage({ pathname: "/user/workout/plans/create" });

    fireEvent.change(screen.getByLabelText("Plan nomi"), {
      target: { value: "Cover plan" },
    });
    fireEvent.change(document.querySelector('input[type="file"]'), {
      target: {
        files: [new File(["cover"], "cover.jpg", { type: "image/jpeg" })],
      },
    });

    await waitFor(() => {
      expect(uploadMock).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/user/media/workout-plan-covers",
        }),
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(createPlanMock).toHaveBeenCalledWith(
        expect.objectContaining({
          coverImageUrl: "https://cdn.example.com/uploaded.jpg",
        }),
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/user/workout/plans/edit/plan-cover",
      );
    });
  });

  it("shows an inline cover upload error when file upload fails", async () => {
    uploadMock.mockRejectedValue(new Error("upload failed"));

    renderPage({ pathname: "/user/workout/plans/create" });

    fireEvent.change(document.querySelector('input[type="file"]'), {
      target: {
        files: [new File(["cover"], "cover.jpg", { type: "image/jpeg" })],
      },
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Rasm yuklab bo'lmadi");
    });
    expect(screen.getByText("Rasm yuklab bo'lmadi")).toBeInTheDocument();
  });

  it("runs AI setup through equipment, muscle group, 1RM, generate, and save", async () => {
    generatePlanMock.mockResolvedValue({
      plan: {
        id: null,
        name: "AI Upper",
        description: "Generated plan",
        coverImageUrl: "https://cdn.example.com/bench.jpg",
        days: 28,
        daysPerWeek: 4,
        schedule: [{ day: "DAY 1", focus: "Chest", exercises: [] }],
        generationMeta: {
          focusMuscles: [{ id: 10, name: "Chest" }],
          benchmark: {
            oneRepMaxKg: 46,
          },
        },
        source: "ai",
      },
    });
    createPlanMock.mockResolvedValue({
      id: "ai-plan-1",
      name: "AI Upper",
    });

    renderPage({ pathname: "/user/workout/plans/create" });

    fireEvent.change(screen.getByLabelText("Plan nomi"), {
      target: { value: "AI Upper" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "AI bilan yaratish" })[0]);
    fireEvent.click(await screen.findByRole("button", { name: "Keyingi" }));
    fireEvent.click(await screen.findByRole("button", { name: "Keyingi" }));
    fireEvent.click(await screen.findByRole("button", { name: "Keyingi" }));
    fireEvent.click(await screen.findByRole("button", { name: "Generate" }));

    await waitFor(() => {
      expect(generatePlanMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "AI Upper",
          days: 28,
          daysPerWeek: 4,
          selectedEquipmentIds: [1, 2],
          focusMuscleIds: [10, 11],
          benchmark: expect.objectContaining({
            exerciseName: "Bench Press",
            oneRepMaxKg: 46,
          }),
        }),
      );
    });

    expect(await screen.findByText("AI Upper")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save plan" }));

    await waitFor(() => {
      expect(createPlanMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "AI Upper",
          source: "ai",
          coverImageUrl: "https://cdn.example.com/bench.jpg",
          generationMeta: expect.objectContaining({
            focusMuscles: [{ id: 10, name: "Chest" }],
          }),
        }),
      );
    });
  });

  it("shows an inline equipment validation error before AI generation", async () => {
    renderPage({ pathname: "/user/workout/plans/create" });

    fireEvent.change(screen.getByLabelText("Plan nomi"), {
      target: { value: "Equipment validation" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "AI bilan yaratish" })[0]);
    fireEvent.click(await screen.findByRole("button", { name: "Keyingi" }));
    fireEvent.click(await screen.findByText("Barbell"));
    fireEvent.click(screen.getByText("Dumbbell"));
    fireEvent.click(screen.getByRole("button", { name: "Keyingi" }));

    expect(await screen.findByText("Kamida bitta jihoz tanlang")).toBeInTheDocument();
    expect(generatePlanMock).not.toHaveBeenCalled();
  });

  it("shows an inline muscle validation error before AI generation", async () => {
    renderPage({ pathname: "/user/workout/plans/create" });

    fireEvent.change(screen.getByLabelText("Plan nomi"), {
      target: { value: "Muscle validation" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "AI bilan yaratish" })[0]);
    fireEvent.click(await screen.findByText("Uskunasiz"));
    fireEvent.click(screen.getByRole("button", { name: "Keyingi" }));
    fireEvent.click(await screen.findByText("Chest"));
    fireEvent.click(screen.getByText("Back"));
    fireEvent.click(screen.getByRole("button", { name: "Keyingi" }));

    expect(
      await screen.findByText("Kamida bitta muscle group tanlang"),
    ).toBeInTheDocument();
    expect(generatePlanMock).not.toHaveBeenCalled();
  });

  it("keeps the AI generator retryable after a generation failure", async () => {
    generatePlanMock
      .mockRejectedValueOnce(new Error("AI down"))
      .mockResolvedValueOnce({
        plan: {
          id: null,
          name: "Retry Upper",
          description: "Generated after retry",
          days: 28,
          daysPerWeek: 4,
          schedule: [{ day: "DAY 1", focus: "Chest", exercises: [] }],
          source: "ai",
        },
      });

    renderPage({ pathname: "/user/workout/plans/create" });

    fireEvent.change(screen.getByLabelText("Plan nomi"), {
      target: { value: "Retry Upper" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "AI bilan yaratish" })[0]);
    fireEvent.click(await screen.findByRole("button", { name: "Keyingi" }));
    fireEvent.click(await screen.findByRole("button", { name: "Keyingi" }));
    fireEvent.click(await screen.findByRole("button", { name: "Keyingi" }));
    fireEvent.click(await screen.findByRole("button", { name: "Generate" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("AI workout reja yaratib bo'lmadi");
    });

    expect(screen.getByRole("button", { name: "Generate" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    expect(await screen.findByText("Retry Upper")).toBeInTheDocument();
    expect(generatePlanMock).toHaveBeenCalledTimes(2);
  });

  it("disables AI generation entry while generation is pending", () => {
    useGenerateWorkoutPlan.mockReturnValue({
      generatePlan: generatePlanMock,
      isPending: true,
    });

    renderPage({ pathname: "/user/workout/plans/create" });

    expect(
      screen.getAllByRole("button", { name: "AI bilan yaratish" })[0],
    ).toBeDisabled();
  });

  it("backs out of AI setup without generating a preview", async () => {
    renderPage({ pathname: "/user/workout/plans/create" });

    fireEvent.change(screen.getByLabelText("Plan nomi"), {
      target: { value: "Manual fallback" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "AI bilan yaratish" })[0]);
    fireEvent.click(await screen.findByRole("button", { name: /orqaga/i }));

    expect(screen.getByText("Yangi workout plan")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Manual fallback")).toBeInTheDocument();
    expect(generatePlanMock).not.toHaveBeenCalled();
  });

  it("skips equipment drawer for bodyweight mode and still requires muscle selection", async () => {
    renderPage({ pathname: "/user/workout/plans/create" });

    fireEvent.change(screen.getByLabelText("Plan nomi"), {
      target: { value: "Bodyweight plan" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "AI bilan yaratish" })[0]);
    fireEvent.click(await screen.findByText("Uskunasiz"));
    fireEvent.click(screen.getByRole("button", { name: "Keyingi" }));

    expect(await screen.findByText("Muscle group tanlang")).toBeInTheDocument();
    expect(screen.queryByText("Jihozlarni tanlang")).not.toBeInTheDocument();
  });
});

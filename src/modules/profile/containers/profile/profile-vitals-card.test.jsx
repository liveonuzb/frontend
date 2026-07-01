import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateGoals } from "@/lib/goal-calculator";
import { ProfileVitalsCard } from "./profile-vitals-card.jsx";

const mockFns = vi.hoisted(() => ({
  navigate: vi.fn(),
  invalidateQueries: vi.fn(),
  setQueryData: vi.fn(),
  initializeUser: vi.fn(),
  saveGoals: vi.fn(),
  putMutateAsync: vi.fn(),
  premiumCheckout: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

const baseOnboarding = {
  goal: "maintain",
  gender: "male",
  age: 30,
  height: { value: 180, unit: "cm" },
  currentWeight: { value: 90, unit: "kg" },
  targetWeight: { value: 75, unit: "kg" },
  activityLevel: "moderately-active",
  weeklyPace: 0.5,
};

const baseGoals = {
  goal: "maintain",
  calories: 2200,
  protein: 150,
  carbs: 250,
  fat: 70,
  fiber: 30,
  waterMl: 2500,
  steps: 10000,
  sleepHours: 8,
  workoutMinutes: 60,
};

let healthGoalsState = {
  goals: baseGoals,
  saveGoals: mockFns.saveGoals,
  isSaving: false,
  hasServerGoals: true,
};

let authState = {
  initializeUser: mockFns.initializeUser,
};

let achievementsQueryData;

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: mockFns.invalidateQueries,
    setQueryData: mockFns.setQueryData,
  }),
}));

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ open, children }) => (open ? <div>{children}</div> : null),
  DrawerContent: ({ children, ...props }) => <div {...props}>{children}</div>,
  DrawerHeader: ({ children, ...props }) => <div {...props}>{children}</div>,
  DrawerTitle: ({ children }) => <h2>{children}</h2>,
  DrawerDescription: ({ children }) => <p>{children}</p>,
  DrawerBody: ({ children, ...props }) => <div {...props}>{children}</div>,
  DrawerFooter: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: () => ({
    data: achievementsQueryData,
    isLoading: false,
    isFetching: false,
  }),
  usePutQuery: () => ({
    mutateAsync: mockFns.putMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/hooks/app/use-health-goals", () => ({
  default: () => healthGoalsState,
  HEALTH_GOALS_QUERY_KEY: ["health-goals"],
}));

vi.mock("@/hooks/app/use-nutrition-dashboard", () => ({
  default: () => ({
    dashboard: {
      calories: { target: 2000 },
      goals: { calories: 2000 },
      meals: { completed: 14 },
      streak: { currentDays: 6 },
    },
  }),
}));

vi.mock("@/hooks/app/use-premium", () => ({
  default: () => ({
    plans: [],
    startPremiumCheckout: mockFns.premiumCheckout,
    isPreparingCheckout: false,
    isActivating: false,
  }),
}));

vi.mock("@/hooks/app/use-me", () => ({
  ME_QUERY_KEY: ["me"],
}));

vi.mock("@/hooks/app/use-measurements", () => ({
  MEASUREMENTS_QUERY_KEY: ["measurements"],
  MEASUREMENTS_TRENDS_QUERY_KEY: ["measurements", "trends"],
}));

vi.mock("@/store", () => ({
  useAuthStore: (selector) => selector(authState),
  useGamificationStore: (selector) =>
    selector({ xp: 1200, streak: 0, earnedBadges: [] }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: mockFns.toastSuccess,
    error: mockFns.toastError,
  },
}));

const renderCard = (props = {}) =>
  render(
    <MemoryRouter initialEntries={["/user/dashboard/profile"]}>
      <ProfileVitalsCard
        user={{
          firstName: "Ali",
          lastName: "Valiyev",
          username: "ali",
          onboarding: baseOnboarding,
          xp: 1200,
        }}
        displayName="Ali Valiyev"
        initials="AV"
        completion={72}
        onEditProfile={vi.fn()}
        onOpenPremium={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  );

const openGoalDrawer = () => {
  fireEvent.click(screen.getByRole("button", { name: /Goal Saqlash/i }));
};

describe("ProfileVitalsCard goal drawers", () => {
  afterEach(() => {
    vi.clearAllMocks();
    healthGoalsState = {
      goals: baseGoals,
      saveGoals: mockFns.saveGoals,
      isSaving: false,
      hasServerGoals: true,
    };
    authState = {
      initializeUser: mockFns.initializeUser,
    };
    achievementsQueryData = undefined;
  });

  it("renders the mobile profile summary and metric grid", () => {
    renderCard();

    expect(screen.getByLabelText("Avg. cal 2000")).toBeInTheDocument();
    expect(screen.getByLabelText("Streak 6")).toBeInTheDocument();
    expect(screen.getByLabelText("Total logs 14")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Current weight 90 kg/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Target weight 75 kg/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Height 180 cm/i }),
    ).toBeInTheDocument();
  });

  it("opens the goal selection drawer from the fitness metric grid", () => {
    renderCard();

    openGoalDrawer();

    expect(screen.getByText("Maqsadni tanlang")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Massa/i })).toBeInTheDocument();
  });

  it("renders achievement preview from gamification achievements", async () => {
    achievementsQueryData = {
      data: [
        { id: "meal", name: "Meal master", unlocked: true },
        { id: "water", name: "Water starter", unlocked: true },
        { id: "locked", name: "Future badge", unlocked: false },
      ],
    };

    renderCard();

    expect(await screen.findByText("Meal master")).toBeInTheDocument();
    expect(screen.getByText("Water starter")).toBeInTheDocument();
    expect(screen.getByText("Locked")).toBeInTheDocument();
  });

  it("saves target weight from the fitness metric drawer", async () => {
    mockFns.putMutateAsync.mockResolvedValueOnce({});

    renderCard();
    fireEvent.click(
      screen.getByRole("button", { name: /Target weight 75 kg/i }),
    );

    expect(await screen.findByText("Maqsad vazn")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));

    await waitFor(() => {
      expect(mockFns.putMutateAsync).toHaveBeenCalledWith({
        url: "/user/onboarding/user",
        attributes: { targetWeight: { value: 75, unit: "kg" } },
      });
    });
  });

  it("saves the selected goal immediately and opens macro targets", async () => {
    const gainTargets = calculateGoals({
      gender: "male",
      age: 30,
      heightValue: 180,
      currentWeightValue: 90,
      goal: "gain",
      activityLevel: "moderately-active",
      weeklyPace: 0.5,
    });
    const savedGoals = { ...baseGoals, ...gainTargets, goal: "gain" };
    mockFns.saveGoals.mockResolvedValueOnce(savedGoals);

    renderCard();
    openGoalDrawer();
    fireEvent.click(screen.getByRole("button", { name: /Massa/i }));

    await waitFor(() => {
      expect(mockFns.saveGoals).toHaveBeenCalledWith(
        expect.objectContaining({
          goal: "gain",
          calories: gainTargets.calories,
          protein: gainTargets.protein,
          carbs: gainTargets.carbs,
          fat: gainTargets.fat,
        }),
      );
    });
    expect(
      await screen.findByText("Kaloriya va macro targetlar"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Kaloriya")).toHaveValue(gainTargets.calories);
  });

  it("saves edited calories and macros from the macro drawer", async () => {
    const gainTargets = calculateGoals({
      gender: "male",
      age: 30,
      heightValue: 180,
      currentWeightValue: 90,
      goal: "gain",
      activityLevel: "moderately-active",
      weeklyPace: 0.5,
    });
    const savedGoals = { ...baseGoals, ...gainTargets, goal: "gain" };
    mockFns.saveGoals
      .mockResolvedValueOnce(savedGoals)
      .mockResolvedValueOnce({
        ...savedGoals,
        calories: 3000,
        protein: 180,
        carbs: 320,
        fat: 90,
      });

    renderCard();
    openGoalDrawer();
    fireEvent.click(screen.getByRole("button", { name: /Massa/i }));

    await screen.findByText("Kaloriya va macro targetlar");

    fireEvent.change(screen.getByLabelText("Kaloriya"), {
      target: { value: "3000" },
    });
    fireEvent.change(screen.getByLabelText("Oqsil"), {
      target: { value: "180" },
    });
    fireEvent.change(screen.getByLabelText("Carbs"), {
      target: { value: "320" },
    });
    fireEvent.change(screen.getByLabelText("Fat"), {
      target: { value: "90" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));

    await waitFor(() => {
      expect(mockFns.saveGoals).toHaveBeenLastCalledWith({
        goal: "gain",
        calories: 3000,
        protein: 180,
        carbs: 320,
        fat: 90,
      });
    });
  });

  it("keeps the goal drawer open when immediate goal save fails", async () => {
    mockFns.saveGoals.mockRejectedValueOnce(new Error("save failed"));

    renderCard();
    openGoalDrawer();
    fireEvent.click(screen.getByRole("button", { name: /Massa/i }));

    await waitFor(() => {
      expect(mockFns.toastError).toHaveBeenCalledWith(
        "Maqsadni saqlab bo'lmadi",
      );
    });
    expect(screen.getByText("Maqsadni tanlang")).toBeInTheDocument();
    expect(
      screen.queryByText("Kaloriya va macro targetlar"),
    ).not.toBeInTheDocument();
  });
});

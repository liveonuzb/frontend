import React from "react";
import { act } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StreakReminderDrawer from "./streak-reminder-drawer.jsx";
import { useGetQuery } from "@/hooks/api";

const mocks = vi.hoisted(() => ({
  confetti: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("canvas-confetti", () => ({
  default: mocks.confetti,
}));

vi.mock("sonner", () => ({
  toast: {
    success: mocks.toastSuccess,
  },
}));

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children, open }) =>
    open ? <div data-testid="drawer-root">{children}</div> : null,
  DrawerContent: ({ children, className, ...props }) => (
    <section className={className} {...props}>
      {children}
    </section>
  ),
  DrawerHeader: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
  DrawerTitle: ({ children, className }) => <h2 className={className}>{children}</h2>,
  DrawerDescription: ({ children, className }) => (
    <p className={className}>{children}</p>
  ),
  DrawerBody: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: vi.fn(),
}));

vi.mock("@/store", () => ({
  useAuthStore: (selector) =>
    selector({
      user: { id: "user-1" },
    }),
}));

const today = "2026-06-17";

const mockDashboardQueries = ({
  currentStreak = 4,
  longestStreak = 6,
  dayData = { date: today, waterCups: 1, waterLog: [{ amountMl: 250 }] },
} = {}) => {
  vi.mocked(useGetQuery).mockImplementation(({ url }) => {
    if (url === "/users/me") {
      return {
        data: {
          data: {
            id: "user-1",
            currentStreak,
            longestStreak,
          },
        },
      };
    }

    return {
      data: {
        data: dayData,
      },
    };
  });
};

const advanceTimers = async (ms) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

const openRewardDrawer = async () => {
  await advanceTimers(3000);

  expect(screen.getByText("4 kunlik streak!")).toBeInTheDocument();
};

describe("StreakReminderDrawer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 17, 12));
    window.localStorage.clear();
    document.body.innerHTML = "";
    mockDashboardQueries();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    window.localStorage.clear();
    document.body.innerHTML = "";
  });

  it("does not open before the user has meaningful activity today", async () => {
    mockDashboardQueries({
      dayData: {
        date: today,
        waterCups: 0,
        waterLog: [],
        meals: {},
        mood: null,
        workoutMinutes: 0,
        sleepHours: 0,
        steps: 0,
      },
    });

    render(<StreakReminderDrawer />);

    await advanceTimers(3500);

    expect(screen.queryByTestId("drawer-root")).not.toBeInTheDocument();
  });

  it("opens a celebration-style reward drawer after today's first activity", async () => {
    render(<StreakReminderDrawer />);

    await openRewardDrawer();

    const drawer = screen.getByTestId("streak-reward-drawer");
    const strip = screen.getByTestId("streak-reward-week-strip");

    expect(drawer).toHaveClass("before:bg-card");
    expect(screen.getByLabelText("Streak reward trophy")).toHaveClass(
      "rounded-[2rem]",
      "bg-muted/40",
    );
    expect(screen.getByText("Ajoyib! Bugun ham entry qo'shdingiz.")).toBeInTheDocument();
    expect(strip).toHaveClass("grid", "grid-cols-6");
    expect(screen.getAllByTestId("streak-reward-day-active")).toHaveLength(4);
    expect(screen.getAllByTestId("streak-reward-day-inactive")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "+10 XPni olish" })).toHaveClass(
      "rounded-full",
      "bg-primary",
      "text-primary-foreground",
    );
    expect(mocks.confetti).toHaveBeenCalled();
  });

  it("acknowledges the reward for today when the CTA is pressed", async () => {
    render(<StreakReminderDrawer />);

    await openRewardDrawer();

    fireEvent.click(screen.getByRole("button", { name: "+10 XPni olish" }));

    expect(screen.queryByTestId("drawer-root")).not.toBeInTheDocument();
    expect(window.localStorage.getItem("streak-reward:acknowledged-on:user-1")).toBe(
      today,
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith("+10 XP streak bonusi olindi");
  });

  it("does not reopen after today's reward has been acknowledged", async () => {
    window.localStorage.setItem("streak-reward:acknowledged-on:user-1", today);

    render(<StreakReminderDrawer />);

    await advanceTimers(3500);

    expect(screen.queryByTestId("drawer-root")).not.toBeInTheDocument();
  });

  it("retries opening while another bottom drawer is blocking the screen", async () => {
    const blocker = document.createElement("div");
    blocker.setAttribute("data-vaul-drawer-direction", "bottom");
    document.body.appendChild(blocker);

    render(<StreakReminderDrawer />);

    await advanceTimers(3000);

    expect(screen.queryByTestId("drawer-root")).not.toBeInTheDocument();

    blocker.remove();
    await advanceTimers(5000);

    expect(screen.getByText("4 kunlik streak!")).toBeInTheDocument();
  });
});

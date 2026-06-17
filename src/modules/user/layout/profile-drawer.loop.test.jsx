import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { forEach } from "lodash";
import { MemoryRouter, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfileDrawer from "./profile-drawer.jsx";
import { useAuthStore } from "@/store";

const apiMocks = vi.hoisted(() => ({
  getResponse: vi.fn(),
  putMutateAsync: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: () => {},
  },
  useTranslation: () => ({
    i18n: { language: "uz" },
    t: (key, options = {}) =>
      typeof options === "string" ? options : options.defaultValue || key,
  }),
}));

vi.mock("@/hooks/api", async () => {
  const actual = await vi.importActual("@/hooks/api");
  const mutation = {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  };

    return {
      ...actual,
      useGetQuery: (options = {}) => ({
        data: apiMocks.getResponse(options),
        isLoading: false,
        isFetching: false,
      }),
      useDeleteQuery: () => mutation,
      usePatchQuery: () => mutation,
      usePostQuery: () => mutation,
      usePostFileQuery: () => mutation,
    usePutQuery: () => ({
      mutate: vi.fn(),
      mutateAsync: apiMocks.putMutateAsync,
      isPending: false,
    }),
  };
});

const LocationProbe = () => {
  const location = useLocation();

  return (
    <div data-testid="profile-drawer-location">
      {location.pathname}
      {location.search}
    </div>
  );
};

const renderProfileDrawer = (
  initialEntry = "/user/dashboard/profile",
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <LocationProbe />
        <ProfileDrawer />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("ProfileDrawer", () => {
  beforeEach(() => {
    apiMocks.getResponse.mockReset();
    apiMocks.getResponse.mockReturnValue(undefined);
    apiMocks.putMutateAsync.mockReset();
    apiMocks.putMutateAsync.mockResolvedValue({ data: {} });

    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: localStorageMock,
    });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: localStorageMock,
    });

    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    useAuthStore.setState({
      isAuthenticated: true,
      roles: ["USER"],
      activeRole: "USER",
      user: {
        id: "user-1",
        firstName: "Fazliddin",
        lastName: "Liveon",
        username: "fazliddin",
        phone: "+998901234567",
        xp: 2450,
        streak: 149,
        achievementCount: 271,
        level: 8,
        levelProgress: 72,
        premium: { status: "active", planName: "Pro" },
        onboarding: {
          gender: "male",
          age: 28,
          currentWeight: { value: 78, unit: "kg" },
          height: { value: 180, unit: "cm" },
        },
        settings: { language: "uz" },
      },
    });
  });

  it("renders the overview without recursive updates", async () => {
    renderProfileDrawer();

    expect(screen.getByRole("heading", { name: "Profile" })).toHaveClass(
      "sr-only",
    );
    expect(
      screen.queryByText("profile.healthReport.title"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("profile.healthReport.action"),
    ).not.toBeInTheDocument();
    expect(
      document.querySelector("[data-slot='drawer-header'] .lucide-x"),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Fazliddin Liveon").length).toBeGreaterThan(0);
    expect(document.querySelector("[data-slot='drawer-content']")).toHaveClass(
      "data-[vaul-drawer-direction=bottom]:md:max-w-sm",
      "data-[vaul-drawer-direction=bottom]:max-h-[100vh]",
    );
    await waitFor(() => {
      expect(screen.getAllByText("Fazliddin Liveon").length).toBeGreaterThan(0);
    });
  });

  it("uses the dashboard card rhythm inside the drawer", async () => {
    renderProfileDrawer();

    expect(document.querySelector("[data-slot='drawer-content']")).toHaveClass(
      "user-card-scope",
    );

    const statCard = (
      await screen.findByLabelText("XP 2.5K")
    ).closest("[data-slot='card']");
    expect(statCard).toHaveClass(
      "user-card",
      "rounded-2xl",
      "border-0",
      "bg-card",
      "shadow-none",
      "ring-0",
    );

    const vitalsCard = screen
      .getByRole("button", { name: /Maqsad.*Saqlash/i })
      .closest(".user-surface");
    expect(vitalsCard).toHaveClass(
      "user-surface",
      "rounded-2xl",
      "border-0",
      "bg-card",
      "shadow-none",
      "ring-0",
    );

    const settingsCard = screen
      .getByRole("button", { name: /Mode/i })
      .closest("[data-slot='card']");
    expect(settingsCard).toHaveClass(
      "user-card",
      "rounded-2xl",
      "border-0",
      "bg-card",
      "shadow-none",
      "ring-0",
      "py-0",
    );

    forEach(
      [
        /profile\.tabs\.privacy/i,
        /profile\.tabs\.friends/i,
        /Tizimdan chiqish/i,
      ],
      (name) => {
        expect(
          screen.getByRole("button", { name }).closest("[data-slot='card']"),
        ).toHaveClass("py-0");
      },
    );
  });

  it("renders editable vitals rows in the centered profile hero", async () => {
    renderProfileDrawer();

    expect(await screen.findByLabelText("Streak 149")).toBeInTheDocument();
    expect(screen.getByLabelText("XP 2.5K")).toBeInTheDocument();
    expect(screen.getByLabelText("Achievement 271")).toBeInTheDocument();
    expect(screen.getByTestId("profile-stat-grid")).toHaveClass(
      "-mx-5",
      "grid-cols-3",
    );
    expect(
      screen.getByTestId("profile-stat-grid").closest("section"),
    ).toHaveClass("pb-0");
    forEach(["Streak 149", "XP 2.5K", "Achievement 271"], (label) => {
      const statCard = screen
        .getByLabelText(label)
        .closest("[data-slot='card']");

      expect(statCard).toBeInTheDocument();
      expect(statCard).toHaveClass("w-full");
      expect(statCard).toHaveAttribute("data-size", "sm");
      expect(statCard).toHaveClass("!py-0");
      expect(
        statCard.querySelector("[data-slot='card-content']"),
      ).toHaveClass("min-h-16", "!px-1.5", "py-2");
    });
    const avatarRing = screen.getByLabelText(/Profil to'liqligi/i);
    expect(avatarRing).toHaveClass("size-28", "p-1.5");
    expect(
      avatarRing.querySelector("[data-slot='avatar']"),
    ).toHaveClass("size-24", "border-2");
    expect(screen.queryByText("Level 8")).not.toBeInTheDocument();
    expect(screen.queryByText("72% profil")).not.toBeInTheDocument();
    expect(screen.queryByText("Premium")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("profile-premium-status-badge"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("profile-premium-status-card"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Profilni tahrirlash/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Avatarni tahrirlash/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Premium Premium$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Premium sotib olish/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Maqsad.*Saqlash/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Jinsi.*Erkak/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Yoshi.*28 yosh/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Vazn.*78 kg/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Bo'y.*180 cm/i }),
    ).toBeInTheDocument();
  });

  it("does not show premium billing shortcuts in the profile overview", async () => {
    apiMocks.getResponse.mockImplementation(({ url }) => {
      if (url !== "/users/me/premium") {
        return undefined;
      }

      return {
        data: {
          premium: { status: "active", planName: "Pro" },
          plans: [
            {
              code: "pro",
              name: "Pro",
              period: "oy",
              price: 39000,
              durationDays: 30,
            },
          ],
          recentPayments: [
            { id: "p1", amount: 39000, date: "2026-06-01", method: "MULTI" },
            { id: "p2", amount: 39000, date: "2026-05-01", method: "MULTI" },
            { id: "p3", amount: 39000, date: "2026-04-01", method: "MULTI" },
            { id: "p4", amount: 39000, date: "2026-03-01", method: "MULTI" },
          ],
          history: [
            {
              id: "h1",
              planName: "Pro",
              status: "active",
              startDate: "2026-06-01",
              endDate: null,
            },
            {
              id: "h2",
              planName: "Pro",
              status: "expired",
              startDate: "2026-05-01",
              endDate: "2026-05-31",
            },
          ],
        },
      };
    });

    renderProfileDrawer();
    await screen.findByText("Fazliddin Liveon");

    expect(
      screen.queryByRole("button", { name: /Invoices/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Obunalar tarixi/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("profile-billing-shortcuts")).not.toBeInTheDocument();
    const privacyShortcut = screen.getByRole("button", {
      name: /profile\.tabs\.privacy/i,
    });
    const sharedCard = privacyShortcut.closest("[data-slot='card']");
    expect(
      screen
        .getByRole("button", { name: /profile\.tabs\.security/i })
        .closest("[data-slot='card']"),
    ).toBe(sharedCard);
  });

  it("does not show a premium CTA below stats for free users", async () => {
    const user = useAuthStore.getState().user;
    useAuthStore.setState({
      user: {
        ...user,
        premium: { status: "free", planName: null },
      },
    });

    renderProfileDrawer();

    await screen.findByText("Fazliddin Liveon");
    expect(
      screen.queryByRole("button", { name: /Premium sotib olish/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Premium sotib ol")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Pro tarifini tanlang" }),
    ).not.toBeInTheDocument();
  });

  it("opens goals from the profile vitals card as a routed drawer", async () => {
    renderProfileDrawer();

    fireEvent.click(
      await screen.findByRole("button", { name: /Maqsad.*Saqlash/i }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("profile-drawer-location")).toHaveTextContent(
        "/user/dashboard/profile/overview/goals",
      );
    });
    expect(await screen.findByText("Maqsadni tanlang")).toBeInTheDocument();
  });

  it("keeps mode theme language and notifications inside one settings card", async () => {
    renderProfileDrawer();

    const modeCard = (
      await screen.findByRole("button", { name: /Mode/i })
    ).closest("[data-slot='card']");

    expect(
      screen.getByRole("button", { name: /Theme/i }).closest("[data-slot='card']"),
    ).toBe(modeCard);
    expect(
      screen
        .getByRole("button", { name: /profile\.tabs\.general/i })
        .closest("[data-slot='card']"),
    ).toBe(modeCard);
    expect(
      screen
        .getByRole("button", { name: /profile\.tabs\.notifications/i })
        .closest("[data-slot='card']"),
    ).toBe(modeCard);
    expect(
      screen.queryByRole("button", { name: /profile\.tabs\.health/i }),
    ).not.toBeInTheDocument();
  });

  it("opens XP history as a routed profile drawer", async () => {
    renderProfileDrawer();

    fireEvent.click(await screen.findByRole("button", { name: /XP 2\.5K/i }));

    expect(await screen.findByText("XP balans")).toBeInTheDocument();
    expect(screen.getByText("2,450")).toBeInTheDocument();
    expect(screen.getByText("2,450 / 10,000 XP")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /XP tarixi/i }));

    await waitFor(() => {
      expect(screen.getByTestId("profile-drawer-location")).toHaveTextContent(
        "/user/dashboard/profile/overview/xp-history",
      );
    });
    expect(
      document.querySelector('[data-profile-overview-drawer="xp-history"]'),
    ).toBeInTheDocument();
  });

  it("hides accounts when the user only has one role", async () => {
    renderProfileDrawer();

    await screen.findByText("Fazliddin Liveon");

    expect(
      screen.queryByText("common.navUser.accounts"),
    ).not.toBeInTheDocument();
  });

  it("shows accounts when the user has multiple roles", async () => {
    useAuthStore.setState({
      roles: ["USER", "SUPER_ADMIN"],
      activeRole: "USER",
    });

    renderProfileDrawer();

    expect(
      await screen.findByText("common.navUser.accounts"),
    ).toBeInTheDocument();
    expect(screen.getByText("common.roles.USER.label")).toBeInTheDocument();
    expect(
      screen.getByText("common.roles.SUPER_ADMIN.label"),
    ).toBeInTheDocument();
  });

  it("opens a gender drawer and saves the selected onboarding gender", async () => {
    renderProfileDrawer();

    fireEvent.click(
      await screen.findByRole("button", { name: /Jinsi.*Erkak/i }),
    );
    expect(
      await screen.findByText("Profil jinsini tanlang."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Ayol/i }));
    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));

    await waitFor(() => {
      expect(apiMocks.putMutateAsync).toHaveBeenCalledWith({
        url: "/user/onboarding/user",
        attributes: { gender: "female" },
      });
    });
  });

  it("renders the overview when user settings are missing", async () => {
    useAuthStore.setState({
      user: {
        id: "user-1",
        firstName: "Fazliddin",
        lastName: "Liveon",
        username: "fazliddin",
      },
    });

    renderProfileDrawer();

    await waitFor(() => {
      expect(screen.getAllByText("Fazliddin Liveon").length).toBeGreaterThan(0);
    });
  });

  it("opens the security tab as a nested bottom drawer over the profile overview", async () => {
    renderProfileDrawer("/user/dashboard/profile/security");

    expect(screen.getAllByText("Fazliddin Liveon").length).toBeGreaterThan(0);

    const drawer = await waitFor(() => {
      const element = document.querySelector(
        '[data-profile-section-drawer="security"]',
      );
      expect(element).toBeInTheDocument();
      return element;
    });

    expect(drawer).toHaveClass(
      "data-[vaul-drawer-direction=bottom]:md:max-w-sm",
    );
  });

  it("sanitizes removed premium deep links and opens friends and referral nested drawers", async () => {
    let view = renderProfileDrawer("/user/dashboard/profile/premium");

    await waitFor(() => {
      expect(screen.getByTestId("profile-drawer-location")).toHaveTextContent(
        "/user/dashboard/profile",
      );
      expect(
        document.querySelector('[data-profile-section-drawer="premium"]'),
      ).not.toBeInTheDocument();
    });

    view.unmount();

    view = renderProfileDrawer("/user/dashboard/profile/friends");

    await waitFor(() => {
      expect(
        document.querySelector('[data-profile-section-drawer="friends"]'),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole("tab", { name: "Do'stlar 0" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tavsiya 0" })).toBeInTheDocument();

    view.unmount();

    renderProfileDrawer("/user/dashboard/profile/referral");

    await waitFor(() => {
      expect(
        document.querySelector('[data-profile-section-drawer="referral"]'),
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId("profile-drawer-location")).toHaveTextContent(
      "/user/dashboard/profile/referral",
    );
  });

  it("returns to the profile overview when a nested section drawer is closed", async () => {
    renderProfileDrawer("/user/dashboard/profile/security");

    const drawer = await waitFor(() => {
      const element = document.querySelector(
        '[data-profile-section-drawer="security"]',
      );
      expect(element).toBeInTheDocument();
      return element;
    });
    fireEvent.keyDown(drawer, { key: "Escape" });

    await waitFor(() => {
      expect(screen.getByTestId("profile-drawer-location")).toHaveTextContent(
        "/user/dashboard/profile",
      );
    });
  });

  it("keeps mode as a dedicated drawer flow", async () => {
    renderProfileDrawer();

    fireEvent.click(screen.getByRole("button", { name: /Mode/i }));

    expect(await screen.findByText("Pick your mood")).toBeInTheDocument();
  });

  it("opens theme as a drawer without toggling immediately", async () => {
    renderProfileDrawer();

    fireEvent.click(screen.getByRole("button", { name: /Theme/i }));

    await waitFor(() => {
      expect(
        document.querySelector("[data-theme-drawer='true']"),
      ).toBeInTheDocument();
    });
    expect(localStorage.setItem).not.toHaveBeenCalledWith("theme", "dark");
  });
});

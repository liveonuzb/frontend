import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfileDrawer from "./profile-drawer.jsx";
import { useAuthStore } from "@/store";

const apiMocks = vi.hoisted(() => ({
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
    useGetQuery: () => ({
      data: undefined,
      isLoading: false,
      isFetching: false,
    }),
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
  initialEntry = "/user/dashboard?profile=open&profileTab=overview",
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

    expect(screen.getByRole("heading", { name: "Profile" })).toBeInTheDocument();
    expect(
      document.querySelector("[data-slot='drawer-header'] .lucide-x"),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Fazliddin Liveon").length).toBeGreaterThan(0);
    expect(document.querySelector("[data-slot='drawer-content']")).toHaveClass(
      "data-[vaul-drawer-direction=bottom]:md:max-w-sm",
    );
    await waitFor(() => {
      expect(screen.getAllByText("Fazliddin Liveon").length).toBeGreaterThan(0);
    });
  });

  it("renders editable vitals rows in the centered profile hero", async () => {
    renderProfileDrawer();

    expect(await screen.findByText("2,450 XP")).toBeInTheDocument();
    expect(screen.queryByText("Level 8")).not.toBeInTheDocument();
    expect(screen.queryByText("72% profil")).not.toBeInTheDocument();
    expect(screen.getAllByText("Premium").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /Profilni tahrirlash/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Avatarni tahrirlash/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Premium Premium$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Maqsad.*Ko'rish/i }),
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

  it("opens goals from the profile vitals card", async () => {
    renderProfileDrawer();

    fireEvent.click(
      await screen.findByRole("button", { name: /Maqsad.*Ko'rish/i }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("profile-drawer-location")).toHaveTextContent(
        "/user/health",
      );
    });
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

  it("opens the XP balance drawer and links to XP history", async () => {
    renderProfileDrawer();

    fireEvent.click(await screen.findByRole("button", { name: /2,450 XP/i }));

    expect(await screen.findByText("XP balans")).toBeInTheDocument();
    expect(screen.getByText("2,450")).toBeInTheDocument();
    expect(screen.getByText("2,450 / 10,000 XP")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /XP tarixi/i }));

    await waitFor(() => {
      expect(screen.getByTestId("profile-drawer-location")).toHaveTextContent(
        "/user/xp-history",
      );
    });
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
    renderProfileDrawer("/user/dashboard?profile=open&profileTab=security");

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

  it("opens premium and referral deep links as nested drawers", async () => {
    const { unmount } = renderProfileDrawer(
      "/user/dashboard?profile=open&profileTab=premium",
    );

    await waitFor(() => {
      expect(
        document.querySelector('[data-profile-section-drawer="premium"]'),
      ).toBeInTheDocument();
    });

    unmount();

    renderProfileDrawer("/user/dashboard?profile=open&profileTab=referral");

    await waitFor(() => {
      expect(
        document.querySelector('[data-profile-section-drawer="referral"]'),
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId("profile-drawer-location")).toHaveTextContent(
      "/user/dashboard?profile=open&profileTab=referral",
    );
  });

  it("returns to the profile overview when a nested section drawer is closed", async () => {
    renderProfileDrawer("/user/dashboard?profile=open&profileTab=security");

    const drawer = await waitFor(() => {
      const element = document.querySelector(
        '[data-profile-section-drawer="security"]',
      );
      expect(element).toBeInTheDocument();
      return element;
    });
    const closeButton = drawer.querySelector(
      '[aria-label="Profil bo‘limini yopish"]',
    );

    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.getByTestId("profile-drawer-location")).toHaveTextContent(
        "/user/dashboard?profile=open&profileTab=overview",
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

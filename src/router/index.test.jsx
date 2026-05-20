import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RouterIndex from "./index.jsx";

const {
  mockAuthState,
  mockLanguageState,
  mockAppModeState,
  mockTelegramState,
  mockTelegramAuthState,
} = vi.hoisted(() => ({
    mockAuthState: {
      isAuthenticated: true,
      isHydrated: true,
      onboardingCompleted: false,
      onboardingFlowStatus: null,
      user: {
        id: "user-1",
        roles: ["USER"],
        passwordSetupRequired: true,
      },
    },
    mockLanguageState: {
      hasSelectedLanguage: false,
    },
    mockAppModeState: {
      mode: null,
    },
    mockTelegramState: {
      isTelegramWebApp: true,
      initData: "valid-init-data",
      startParam: null,
    },
    mockTelegramAuthState: {
      telegramAuthError: null,
      retryTelegramAuth: vi.fn(),
    },
  }));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

vi.mock("@/components/page-loader/index.jsx", () => ({
  default: () => <div>page-loader</div>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/protected-route", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("@/hooks/use-telegram", () => ({
  useTelegram: () => mockTelegramState,
}));

vi.mock("@/hooks/use-telegram-auth", () => ({
  useTelegramAuth: () => mockTelegramAuthState,
}));

vi.mock("@/hooks/use-telegram-back-button", () => ({
  useTelegramBackButton: vi.fn(),
}));

vi.mock("@/store", () => ({
  useAuthStore: () => mockAuthState,
  useLanguageStore: (selector) => selector(mockLanguageState),
  useAppModeStore: (selector) => selector(mockAppModeState),
}));

const LocationProbe = () => {
  const location = useLocation();
  return <div>location:{location.pathname}</div>;
};

vi.mock("@/modules/auth/index.jsx", () => ({
  default: () => <div>auth-module</div>,
}));
vi.mock("@/modules/landing/index.jsx", () => ({
  default: () => <div>landing-module</div>,
}));
vi.mock("@/modules/user-onboarding/index.jsx", () => ({
  default: () => <div>user-onboarding-module</div>,
}));
vi.mock("@/modules/admin/index.jsx", () => ({
  default: () => <div>admin-module</div>,
}));
vi.mock("@/modules/user/index.jsx", () => ({
  default: () => <div>user-module</div>,
}));
vi.mock("@/pages/not-found/index.jsx", () => ({
  default: () => <div>not-found</div>,
}));
vi.mock("@/pages/referral-redirect/index.jsx", () => ({
  default: () => <div>referral-redirect</div>,
}));

describe("root router Telegram password setup routing", () => {
  beforeEach(() => {
    Object.assign(mockAuthState, {
      isAuthenticated: true,
      isHydrated: true,
      onboardingCompleted: false,
      onboardingFlowStatus: null,
      user: {
        id: "user-1",
        roles: ["USER"],
        passwordSetupRequired: true,
      },
    });
    Object.assign(mockLanguageState, {
      hasSelectedLanguage: false,
    });
    Object.assign(mockAppModeState, {
      mode: null,
    });
    Object.assign(mockTelegramState, {
      isTelegramWebApp: true,
      initData: "valid-init-data",
      startParam: null,
    });
    Object.assign(mockTelegramAuthState, {
      telegramAuthError: null,
      retryTelegramAuth: vi.fn(),
    });
  });

  it("keeps Telegram password setup users on /auth/set-password", async () => {
    render(
      <MemoryRouter initialEntries={["/auth/set-password"]}>
        <RouterIndex />
        <LocationProbe />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("location:/auth/set-password"),
      ).toBeInTheDocument();
    });
  });

  it("allows anonymous users to open auth routes", async () => {
    Object.assign(mockAuthState, {
      isAuthenticated: false,
      user: null,
    });
    Object.assign(mockLanguageState, {
      hasSelectedLanguage: true,
    });
    Object.assign(mockAppModeState, {
      mode: "fitness",
    });
    Object.assign(mockTelegramState, {
      isTelegramWebApp: false,
      initData: "",
      startParam: null,
    });

    render(
      <MemoryRouter initialEntries={["/auth/sign-in"]}>
        <RouterIndex />
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(await screen.findByText("auth-module")).toBeInTheDocument();
    expect(screen.getByText("location:/auth/sign-in")).toBeInTheDocument();
  });

  it("redirects authenticated users away from guest auth routes", async () => {
    Object.assign(mockAuthState, {
      isAuthenticated: true,
      onboardingCompleted: true,
      onboardingFlowStatus: "ACTIVATED",
      user: {
        id: "user-1",
        roles: ["USER"],
        onboardingCompleted: true,
        onboardingFlowStatus: "ACTIVATED",
      },
    });
    Object.assign(mockLanguageState, {
      hasSelectedLanguage: true,
    });
    Object.assign(mockAppModeState, {
      mode: "fitness",
    });
    Object.assign(mockTelegramState, {
      isTelegramWebApp: false,
      initData: "",
      startParam: null,
    });

    render(
      <MemoryRouter initialEntries={["/auth/sign-in"]}>
        <RouterIndex />
        <LocationProbe />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("location:/user")).toBeInTheDocument();
    });
  });

  it("renders Telegram auth errors through i18n keys", () => {
    Object.assign(mockAuthState, {
      isAuthenticated: false,
      user: null,
    });
    Object.assign(mockTelegramState, {
      isTelegramWebApp: true,
      initData: "expired-init-data",
      startParam: null,
    });
    Object.assign(mockTelegramAuthState, {
      telegramAuthError: {},
      retryTelegramAuth: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/auth/sign-in"]}>
        <RouterIndex />
      </MemoryRouter>,
    );

    expect(screen.getByText("auth.telegramAuth.errorTitle")).toBeInTheDocument();
    expect(
      screen.getByText("auth.telegramAuth.errorDescription"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /auth.telegramAuth.retry/i }),
    ).toBeInTheDocument();
  });
});

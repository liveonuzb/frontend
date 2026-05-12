import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import { describe, expect, it, vi } from "vitest";
import RouterIndex from "./index.jsx";

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
  useTelegram: () => ({
    isTelegramWebApp: true,
    initData: "valid-init-data",
  }),
}));

vi.mock("@/hooks/use-telegram-auth", () => ({
  useTelegramAuth: () => ({
    telegramAuthError: null,
    retryTelegramAuth: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-telegram-back-button", () => ({
  useTelegramBackButton: vi.fn(),
}));

vi.mock("@/store", () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
    onboardingCompleted: false,
    onboardingFlowStatus: null,
    user: {
      id: "user-1",
      roles: ["USER"],
      passwordSetupRequired: true,
    },
  }),
  useLanguageStore: (selector) =>
    selector({
      hasSelectedLanguage: false,
    }),
  useAppModeStore: (selector) =>
    selector({
      mode: null,
    }),
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
vi.mock("@/modules/onboarding/user/index.jsx", () => ({
  default: () => <div>user-onboarding-module</div>,
}));
vi.mock("@/modules/onboarding/coach/index.jsx", () => ({
  default: () => <div>coach-onboarding-module</div>,
}));
vi.mock("@/modules/admin/index.jsx", () => ({
  default: () => <div>admin-module</div>,
}));
vi.mock("@/modules/user/index.jsx", () => ({
  default: () => <div>user-module</div>,
}));
vi.mock("@/modules/coach/index.jsx", () => ({
  default: () => <div>coach-module</div>,
}));
vi.mock("@/pages/not-found/index.jsx", () => ({
  default: () => <div>not-found</div>,
}));
vi.mock("@/pages/referral-redirect/index.jsx", () => ({
  default: () => <div>referral-redirect</div>,
}));
vi.mock("@/pages/referral-join/index.jsx", () => ({
  default: () => <div>join-referral</div>,
}));

describe("root router Telegram password setup routing", () => {
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
});

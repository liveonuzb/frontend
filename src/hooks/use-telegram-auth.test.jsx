import React from "react";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTelegramAuth } from "./use-telegram-auth.js";

const completeAuthentication = vi.fn();
const apiPost = vi.fn();
const trackLaunchEvent = vi.fn();
const rememberTelegramCampaignAttribution = vi.fn();

vi.mock("@/hooks/use-telegram", () => ({
  useTelegram: () => ({
    isTelegramWebApp: true,
    initData: "signed-init-data",
    startParam: "water",
  }),
}));

vi.mock("@/store", () => ({
  useAuthStore: () => ({
    isAuthenticated: false,
    completeAuthentication,
  }),
}));

vi.mock("@/hooks/api/use-api", () => ({
  api: {
    post: (...args) => apiPost(...args),
  },
}));

vi.mock("@/lib/analytics.js", () => ({
  rememberTelegramCampaignAttribution: (...args) =>
    rememberTelegramCampaignAttribution(...args),
  trackLaunchEvent: (...args) => trackLaunchEvent(...args),
}));

const HookProbe = () => {
  useTelegramAuth();
  return null;
};

describe("useTelegramAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiPost.mockResolvedValue({
      data: {
        data: {
          accessToken: "access-token",
          user: { id: "user-1" },
        },
      },
    });
    trackLaunchEvent.mockResolvedValue(true);
    rememberTelegramCampaignAttribution.mockReturnValue(null);
  });

  it("tracks Telegram Mini App open analytics with startParam attribution", async () => {
    render(<HookProbe />);

    await waitFor(() => {
      expect(completeAuthentication).toHaveBeenCalledWith({
        accessToken: "access-token",
        user: { id: "user-1" },
      });
    });

    expect(apiPost).toHaveBeenCalledWith("/auth/login/telegram", {
      initData: "signed-init-data",
    });
    expect(rememberTelegramCampaignAttribution).toHaveBeenCalledWith("water");
    expect(trackLaunchEvent).toHaveBeenCalledWith("telegram_miniapp_opened", {
      source: "telegram",
      properties: {
        hasStartParam: true,
        startParam: "water",
        startParamKind: "water",
        startParamRoute: "/user/water",
      },
    });
  });
});

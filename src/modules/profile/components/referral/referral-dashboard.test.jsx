import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useGetQuery, usePatchQuery, usePostQuery } from "@/hooks/api";
import { ReferralDashboard } from "./referral-dashboard.jsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options = {}) => options.defaultValue || key,
  }),
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: vi.fn(),
  usePatchQuery: vi.fn(),
  usePostQuery: vi.fn(),
}));

vi.mock("@/store", () => ({
  useAuthStore: (selector) => selector({ user: { id: "user-1" } }),
}));

describe("ReferralDashboard", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders wrapped referral info from the API envelope", () => {
    vi.mocked(usePatchQuery).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    vi.mocked(usePostQuery).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    });
    vi.mocked(useGetQuery).mockImplementation(({ url }) => {
      if (url === "/referral/me") {
        return {
          data: {
            data: {
              referralCode: "HYGH",
              referralLink: "http://localhost:5173/join?ref=HYGH",
              xpBalance: 245,
              totalXpEarned: 0,
              totalReferrals: 0,
              activeReferrals: 0,
            },
            meta: {
              timestamp: "2026-04-21T16:59:53.468Z",
              correlationId: "29e30d02-d739-4316-ae8d-193bd15729f0",
            },
          },
          isLoading: false,
        };
      }

      if (url === "/referral/me/referrals") {
        return {
          data: {
            data: { referrals: [], total: 0 },
            meta: {},
          },
          isLoading: false,
        };
      }

      if (url === "/referral/me/xp-history") {
        return {
          data: {
            data: { transactions: [], total: 0 },
            meta: {},
          },
          isLoading: false,
        };
      }

      if (url === "/referral/leaderboard" || url === "/referral/me/withdrawals") {
        return {
          data: {
            data: [],
            meta: {},
          },
          isLoading: false,
        };
      }

      return { data: undefined, isLoading: false };
    });

    render(<ReferralDashboard variant="page" />);

    expect(screen.getByText("HYGH")).toBeInTheDocument();
    expect(
      screen.getByText("http://localhost:5173/join?ref=HYGH"),
    ).toBeInTheDocument();
    expect(screen.getByText("245")).toBeInTheDocument();
  });
});

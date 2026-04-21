import React from "react";
import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import JoinReferralPage from "./index.jsx";

const navigate = vi.fn();
const apiGet = vi.fn();
let currentSearch = new URLSearchParams("ref=coach-code");

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");

  return {
    ...actual,
    useNavigate: () => navigate,
    useSearchParams: () => [currentSearch],
  };
});

vi.mock("@/hooks/api/use-api", () => ({
  api: {
    get: (...args) => apiGet(...args),
  },
}));

vi.mock("@/components/page-loader/index.jsx", () => ({
  default: () => <div>loading</div>,
}));

describe("JoinReferralPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
    currentSearch = new URLSearchParams("ref=coach-code");
  });

  it("tracks canonical referral links before redirecting to sign up", async () => {
    apiGet.mockResolvedValue({});

    render(<JoinReferralPage />);

    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith("/coach/referrals/track/coach-code");
      expect(navigate).toHaveBeenCalledWith("/auth/sign-up?ref=coach-code", {
        replace: true,
      });
    });
  });

  it("skips tracking when the request is already marked as tracked", async () => {
    currentSearch = new URLSearchParams("ref=coach-code&tracked=1");

    render(<JoinReferralPage />);

    await waitFor(() => {
      expect(apiGet).not.toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith("/auth/sign-up?ref=coach-code", {
        replace: true,
      });
    });
  });
});

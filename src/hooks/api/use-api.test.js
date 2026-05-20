import { describe, expect, it } from "vitest";
import { toast } from "sonner";
import useAuthStore from "@/store/auth-store";
import {
  api,
  handleForbiddenResponse,
  refreshAccessToken,
  shouldSkipAuthRetry,
} from "./use-api.js";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("use-api auth retry guard", () => {
  it("lets OTP verification 401 errors stay on the OTP form", () => {
    expect(shouldSkipAuthRetry("/auth/verify-otp")).toBe(true);
    expect(shouldSkipAuthRetry("/api/v1/auth/verify-otp")).toBe(true);
  });

  it("lets OTP resend 401 errors stay in the OTP flow", () => {
    expect(shouldSkipAuthRetry("/auth/resend-otp")).toBe(true);
  });

  it("still retries protected API 401 errors", () => {
    expect(shouldSkipAuthRetry("/user/onboarding/status")).toBe(false);
  });

  it("uses a bounded default request timeout", () => {
    expect(api.defaults.timeout).toBe(15000);
  });

  it("shows a centralized forbidden message for 403 responses", () => {
    handleForbiddenResponse();

    expect(toast.error).toHaveBeenCalledWith(
      "Bu amal uchun ruxsat yo'q.",
      { id: "global-forbidden" },
    );
  });

  it("deduplicates concurrent refresh token requests", async () => {
    const completeAuthentication = vi.fn();
    const logout = vi.fn();
    const postSpy = vi.spyOn(api, "post").mockResolvedValue({
      data: {
        data: {
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
          user: { id: "user-1" },
          roles: ["USER"],
        },
      },
    });

    useAuthStore.setState({
      refreshToken: "old-refresh-token",
      completeAuthentication,
      logout,
    });

    const [firstToken, secondToken] = await Promise.all([
      refreshAccessToken(),
      refreshAccessToken(),
    ]);

    expect(firstToken).toBe("new-access-token");
    expect(secondToken).toBe("new-access-token");
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledWith(
      "/auth/refresh",
      { refreshToken: "old-refresh-token" },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    expect(completeAuthentication).toHaveBeenCalledTimes(1);
    expect(logout).not.toHaveBeenCalled();

    postSpy.mockRestore();
  });
});
